

from __future__ import annotations

import json
import logging
import os
import traceback
from datetime import datetime
from typing import Any

from google import genai
from google.genai import types

from .schemas import (
    CalendarEvent,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    ChallengesResponse,
    ForecastResponse,
    Insight,
    RecommendedAction,
    VaultCommand,
)
from .tools import (
    TOOL_DEFINITIONS,
    analyze_calendar_events,
    create_vault_command,
    generate_challenge_from_insights,
    generate_forecast,
    generate_insights,
)

log = logging.getLogger("futurespend.orchestrator")

MAX_TOOL_ITERATIONS = 10
MAX_RETRIES_PER_TOOL = 2
MODEL = "gemini-3.0-flash"

SYSTEM_PROMPT = """\
You are FutureSpend — an intelligent financial co-pilot that transforms \
calendar chaos into money clarity.

You have access to the user's upcoming Google Calendar events and their \
financial context. Your job is to:

1. ANALYZE their calendar to predict spending triggers (meals out, transport, \
   social events, entertainment).
2. FORECAST their 7-day burn rate broken down by category.
3. GENERATE actionable insights — not generic advice, but pattern-specific \
   observations tied to THEIR events.
4. RECOMMEND concrete actions: lock funds in vaults, skip specific events, \
   cook instead of eating out, etc.
5. GAMIFY savings by creating or suggesting challenges based on detected patterns.

RULES:
- Always call analyze_calendar_events FIRST when you receive raw event data.
- After analyzing, call generate_forecast to build the financial picture.
- Then call generate_insights to surface patterns.
- Use create_vault_command when the user wants to protect money proactively.
- Use generate_challenges to create social saving challenges.
- Be direct, specific, and reference actual event names and dollar amounts.
- Never give vague "consider reducing spending" advice — tie everything to \
  specific calendar events.
- Respond in a friendly but sharp tone. You're a smart friend who's great \
  with money, not a boring bank chatbot.
- If a tool call fails, explain what went wrong and try to recover.

CONTEXT:
- Currency: CAD
- Current date: {current_date}
{session_context}
"""


# ── Schema helpers ────────────────────────────────────────────────────────


def _strip_defaults(schema: dict) -> dict:
    """Recursively strip 'default' fields from JSON schemas — Gemini doesn't support them."""
    cleaned: dict = {}
    for k, v in schema.items():
        if k == "default":
            continue
        if isinstance(v, dict):
            cleaned[k] = _strip_defaults(v)
        elif isinstance(v, list):
            cleaned[k] = [_strip_defaults(i) if isinstance(i, dict) else i for i in v]
        else:
            cleaned[k] = v
    return cleaned


def _build_gemini_tools() -> list[types.Tool]:
    """Convert internal TOOL_DEFINITIONS into Gemini Tool objects."""
    declarations = []
    for tool in TOOL_DEFINITIONS:
        func = tool.get("function", {})
        params = func.get("parameters", {"type": "object", "properties": {}})
        declarations.append(types.FunctionDeclaration(
            name=func["name"],
            description=func.get("description", ""),
            parameters=_strip_defaults(params),
        ))
    return [types.Tool(function_declarations=declarations)]


# ── Session state ─────────────────────────────────────────────────────────


class SessionState:
    """
    Holds per-session state across the orchestrator loop.

    Inspired by OpenClaw's context isolation: each tool reads/writes
    only the state fields it needs.
    """

    __slots__ = (
        "events", "forecast", "insights", "challenges", "vault_commands",
        "tool_errors", "retrospective",
    )

    def __init__(self) -> None:
        self.events: list[CalendarEvent] = []
        self.forecast: ForecastResponse | None = None
        self.insights: list[Insight] = []
        self.challenges: ChallengesResponse | None = None
        self.vault_commands: list[VaultCommand] = []
        # OpenClaw pattern: error context capture for recovery
        self.tool_errors: list[dict[str, Any]] = []
        # OpenClaw pattern: session-to-session memory
        self.retrospective: list[str] = []

    def summary(self) -> str:
        """Build a context string for the LLM about current session state."""
        parts = []
        if self.events:
            total = sum(e.predicted_spend for e in self.events)
            parts.append(f"{len(self.events)} events loaded (${total:.0f} predicted)")
        if self.forecast:
            parts.append(
                f"Forecast: ${self.forecast.next_7days_total:.0f} over 7 days, "
                f"${self.forecast.remaining_budget:.0f} remaining, "
                f"risk={self.forecast.risk_score.value}"
            )
        if self.insights:
            parts.append(f"{len(self.insights)} insights detected")
        if self.challenges:
            parts.append(f"{len(self.challenges.list_)} active challenges")
        if self.vault_commands:
            locked = sum(c.amount for c in self.vault_commands if c.action.value == "lock")
            parts.append(f"${locked:.0f} locked in vaults")
        if self.tool_errors:
            parts.append(f"{len(self.tool_errors)} tool errors in this session")
        return "; ".join(parts) if parts else "Fresh session — no data loaded yet."


# ── Tool dispatch registry ────────────────────────────────────────────────


# OpenClaw pattern: tool dispatch as a registry, not if/elif chains.
# Each entry: (handler_fn, required_state_fields)
TOOL_REGISTRY: dict[str, tuple[str, ...]] = {
    "analyze_calendar_events": (),
    "generate_forecast": ("events",),
    "generate_insights": ("events", "forecast"),
    "create_vault_command": (),
    "generate_challenges": ("insights",),
}


# ── Orchestrator ──────────────────────────────────────────────────────────


class Orchestrator:
    """
    The AI brain. One instance per user session.

    Implements OpenClaw's Captain's Chair pattern (simplified for single-agent):
      - Serialized per-session loop with circuit breaker
      - Error recovery with context capture
      - Session state isolation
      - Retrospective analysis for memory
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str = MODEL,
        monthly_budget: float = 1000.0,
    ) -> None:
        self._api_key = (
            api_key
            or os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY", "")
        )
        self._client: genai.Client | None = None
        self._model = model
        self._tools = _build_gemini_tools()
        self._monthly_budget = monthly_budget
        self._state = SessionState()
        self._history: list[types.Content] = []
        # Circuit breaker: track per-tool failure counts
        self._tool_failures: dict[str, int] = {}

    def _get_client(self) -> genai.Client:
        """Lazy-init the Gemini client (only needed for LLM calls, not pipeline)."""
        if self._client is None:
            if not self._api_key:
                raise ValueError(
                    "GEMINI_API_KEY not set. Add it to .env or pass api_key= to Orchestrator."
                )
            self._client = genai.Client(api_key=self._api_key)
        return self._client

    @property
    def state(self) -> SessionState:
        return self._state

    def _system_prompt(self) -> str:
        session_ctx = self._state.summary()
        return SYSTEM_PROMPT.format(
            current_date=datetime.now().strftime("%Y-%m-%d"),
            session_context=f"- Session state: {session_ctx}" if session_ctx else "",
        )

    def _check_preconditions(self, name: str) -> str | None:
        """
        OpenClaw pattern: validate tool preconditions before execution.
        Returns an error message if preconditions aren't met, None if OK.
        """
        required = TOOL_REGISTRY.get(name, ())
        missing = []
        if "events" in required and not self._state.events:
            missing.append("events (call analyze_calendar_events first)")
        if "forecast" in required and not self._state.forecast:
            missing.append("forecast (call generate_forecast first)")
        if "insights" in required and not self._state.insights:
            missing.append("insights (call generate_insights first)")
        if missing:
            return f"Missing preconditions: {', '.join(missing)}"
        return None

    def _execute_tool(self, name: str, input_args: dict[str, Any]) -> str:
        """
        Dispatch a tool call with error recovery.

        OpenClaw patterns applied:
          - Precondition validation
          - Circuit breaker (max retries per tool)
          - Error context capture for LLM recovery
        """
        # Circuit breaker check
        failures = self._tool_failures.get(name, 0)
        if failures >= MAX_RETRIES_PER_TOOL:
            error_msg = f"Circuit breaker: {name} has failed {failures} times. Skipping."
            log.warning(error_msg)
            return json.dumps({"error": error_msg, "circuit_breaker": True})

        # Precondition check
        precheck = self._check_preconditions(name)
        if precheck:
            return json.dumps({"error": precheck})

        try:
            result = self._dispatch_tool(name, input_args)
            # Reset failure count on success
            self._tool_failures[name] = 0
            return result
        except Exception as e:
            # OpenClaw pattern: error context capture
            self._tool_failures[name] = failures + 1
            error_context = {
                "tool": name,
                "args": input_args,
                "error": str(e),
                "traceback": traceback.format_exc(),
                "attempt": failures + 1,
            }
            self._state.tool_errors.append(error_context)
            log.error(f"Tool {name} failed (attempt {failures + 1}): {e}")
            return json.dumps({
                "error": str(e),
                "tool": name,
                "recoverable": failures + 1 < MAX_RETRIES_PER_TOOL,
            })

    def _dispatch_tool(self, name: str, args: dict[str, Any]) -> str:
        """Pure dispatch — no error handling, that's in _execute_tool."""
        if name == "analyze_calendar_events":
            raw = args.get("raw_events", [])
            self._state.events = analyze_calendar_events(raw)
            return json.dumps(
                [e.model_dump(by_alias=True) for e in self._state.events],
                default=str,
            )

        if name == "generate_forecast":
            budget = args.get("monthly_budget", self._monthly_budget)
            spent = args.get("spent_so_far", 0.0)
            self._state.forecast = generate_forecast(
                self._state.events, budget, spent
            )
            return json.dumps(
                self._state.forecast.model_dump(by_alias=True),
                default=str,
            )

        if name == "generate_insights":
            self._state.insights = generate_insights(
                self._state.events, self._state.forecast
            )
            return json.dumps(
                [i.model_dump() for i in self._state.insights],
                default=str,
            )

        if name == "create_vault_command":
            cmd = create_vault_command(
                action=args["action"],
                amount=args["amount"],
                reason=args["reason"],
                vault_name=args.get("vault_name", "default"),
            )
            self._state.vault_commands.append(cmd)
            return json.dumps(cmd.model_dump(), default=str)

        if name == "generate_challenges":
            user_name = args.get("user_name", "You")
            self._state.challenges = generate_challenge_from_insights(
                self._state.insights, user_name
            )
            return json.dumps(
                self._state.challenges.model_dump(by_alias=True),
                default=str,
            )

        return json.dumps({"error": f"Unknown tool: {name}"})

    def _call_llm(self) -> Any:
        """Single LLM call with current history and tools."""
        return self._get_client().models.generate_content(
            model=self._model,
            contents=self._history,
            config=types.GenerateContentConfig(
                tools=self._tools,
                system_instruction=self._system_prompt(),
            ),
        )

    def run(self, user_message: str) -> str:
        """
        Main orchestrator loop (Captain's Chair pattern).

        Serialized per-session: message → LLM → tool_use → execute →
        feed result back → repeat until text response or circuit breaker.
        """
        self._history.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_message)],
        ))

        response = self._call_llm()

        for iteration in range(MAX_TOOL_ITERATIONS):
            function_calls = []
            text_parts = []

            if response.candidates and response.candidates[0].content:
                for part in response.candidates[0].content.parts:
                    if part.function_call:
                        function_calls.append(part)
                    if part.text:
                        text_parts.append(part.text)

                self._history.append(response.candidates[0].content)

            if not function_calls:
                reply = "".join(text_parts).strip() or "I couldn't generate a response."
                return reply

            # Execute tools with error recovery
            fn_response_parts = []
            for part in function_calls:
                fc = part.function_call
                args = dict(fc.args) if fc.args else {}
                log.info(f"Tool call [{iteration}]: {fc.name}({list(args.keys())})")
                result_str = self._execute_tool(fc.name, args)
                fn_response_parts.append(types.Part.from_function_response(
                    name=fc.name,
                    response={"result": result_str},
                ))

            self._history.append(types.Content(
                role="user",
                parts=fn_response_parts,
            ))

            response = self._call_llm()

        return (
            "I've processed your request but hit the analysis limit. "
            "Here's what I found so far based on the tools I ran."
        )

    def run_pipeline(
        self,
        raw_events: list[dict[str, Any]],
        monthly_budget: float = 1000.0,
        spent_so_far: float = 0.0,
    ) -> dict[str, Any]:
        """
        Deterministic pipeline — runs tools directly without LLM.

        OpenClaw calls this the "structured output" pattern:
        predictable tool chain, typed returns, no LLM reasoning needed.
        """
        self._monthly_budget = monthly_budget
        self._state.events = analyze_calendar_events(raw_events)
        self._state.forecast = generate_forecast(
            self._state.events, monthly_budget, spent_so_far
        )
        self._state.insights = generate_insights(
            self._state.events, self._state.forecast
        )
        self._state.challenges = generate_challenge_from_insights(
            self._state.insights
        )

        return {
            "events": [e.model_dump(by_alias=True) for e in self._state.events],
            "forecast": self._state.forecast.model_dump(by_alias=True),
            "insights": [i.model_dump() for i in self._state.insights],
            "challenges": self._state.challenges.model_dump(by_alias=True),
        }

    def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Coach chat endpoint.

        OpenClaw pattern: context injection without excessive checkpoints.
        Auto-proceeds with session state, only asks user for genuinely
        ambiguous decisions.
        """
        enriched_message = request.message

        # Auto-inject context on first message (no checkpoint needed — obvious action)
        if not self._history:
            ctx = self._state.summary()
            if ctx and ctx != "Fresh session — no data loaded yet.":
                enriched_message = f"[Session context: {ctx}]\n\n{request.message}"

        reply_text = self.run(enriched_message)

        reply = ChatMessage(
            id=f"msg-{len(self._history)}",
            role="assistant",
            content=reply_text,
            timestamp=datetime.now().isoformat(),
        )

        actions = []
        if self._state.forecast and self._state.forecast.recommended_actions:
            actions = self._state.forecast.recommended_actions

        return ChatResponse(reply=reply, actions=actions)

    def get_retrospective(self) -> dict[str, Any]:
        """
        OpenClaw pattern: session-to-session memory.

        Returns a retrospective summary of what happened in this session,
        useful for passing context to future sessions.
        """
        return {
            "events_analyzed": len(self._state.events),
            "total_predicted_spend": (
                self._state.forecast.next_7days_total
                if self._state.forecast else 0
            ),
            "risk_level": (
                self._state.forecast.risk_score.value
                if self._state.forecast else "unknown"
            ),
            "insights_found": len(self._state.insights),
            "challenges_created": (
                len(self._state.challenges.list_)
                if self._state.challenges else 0
            ),
            "vault_actions": len(self._state.vault_commands),
            "tool_errors": len(self._state.tool_errors),
            "conversation_turns": len(self._history),
        }
