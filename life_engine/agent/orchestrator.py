"""
FutureSpend AI Orchestrator.

Follows the OpenClaw Captain's Chair loop pattern (simplified):
  1. Assemble context (system prompt + user message + session state)
  2. LLM inference with tool definitions
  3. If tool_use → execute tool → append result → goto 2
  4. If text response → return to user
  5. Loop serialized per-session, max iterations capped

Uses Anthropic's Claude API with native tool/function calling.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any

import anthropic

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

MAX_TOOL_ITERATIONS = 8
MODEL = "claude-sonnet-4-5-20250514"

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

CONTEXT:
- Currency: CAD
- Current date: {current_date}
"""


class SessionState:
    """Holds per-session state across the orchestrator loop."""

    __slots__ = ("events", "forecast", "insights", "challenges", "vault_commands")

    def __init__(self) -> None:
        self.events: list[CalendarEvent] = []
        self.forecast: ForecastResponse | None = None
        self.insights: list[Insight] = []
        self.challenges: ChallengesResponse | None = None
        self.vault_commands: list[VaultCommand] = []


class Orchestrator:
    """
    The AI brain. One instance per user session.

    Manages the inference loop, tool dispatch, and session state.
    Inspired by OpenClaw's serialized per-session agent loop.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str = MODEL,
        monthly_budget: float = 1000.0,
    ) -> None:
        self._client = anthropic.Anthropic(
            api_key=api_key or os.environ.get("ANTHROPIC_API_KEY", ""),
        )
        self._model = model
        self._monthly_budget = monthly_budget
        self._state = SessionState()
        self._message_history: list[dict[str, Any]] = []

    @property
    def state(self) -> SessionState:
        return self._state

    def _system_prompt(self) -> str:
        return SYSTEM_PROMPT.format(
            current_date=datetime.now().strftime("%Y-%m-%d"),
        )

    def _execute_tool(self, name: str, input_args: dict[str, Any]) -> str:
        """
        Dispatch a tool call to the appropriate function.
        Returns a JSON string of the result for the LLM.
        """
        if name == "analyze_calendar_events":
            raw = input_args.get("raw_events", [])
            self._state.events = analyze_calendar_events(raw)
            return json.dumps(
                [e.model_dump(by_alias=True) for e in self._state.events],
                default=str,
            )

        if name == "generate_forecast":
            if not self._state.events:
                return json.dumps({"error": "No events analyzed yet. Call analyze_calendar_events first."})
            budget = input_args.get("monthly_budget", self._monthly_budget)
            spent = input_args.get("spent_so_far", 0.0)
            self._state.forecast = generate_forecast(
                self._state.events, budget, spent
            )
            return json.dumps(
                self._state.forecast.model_dump(by_alias=True),
                default=str,
            )

        if name == "generate_insights":
            if not self._state.events or not self._state.forecast:
                return json.dumps({"error": "Need events and forecast first."})
            self._state.insights = generate_insights(
                self._state.events, self._state.forecast
            )
            return json.dumps(
                [i.model_dump() for i in self._state.insights],
                default=str,
            )

        if name == "create_vault_command":
            cmd = create_vault_command(
                action=input_args["action"],
                amount=input_args["amount"],
                reason=input_args["reason"],
                vault_name=input_args.get("vault_name", "default"),
            )
            self._state.vault_commands.append(cmd)
            return json.dumps(cmd.model_dump(), default=str)

        if name == "generate_challenges":
            if not self._state.insights:
                return json.dumps({"error": "Need insights first."})
            user_name = input_args.get("user_name", "You")
            self._state.challenges = generate_challenge_from_insights(
                self._state.insights, user_name
            )
            return json.dumps(
                self._state.challenges.model_dump(by_alias=True),
                default=str,
            )

        return json.dumps({"error": f"Unknown tool: {name}"})

    def run(self, user_message: str) -> str:
        """
        Main orchestrator loop.

        Sends user message → LLM → handles tool calls → loops until
        the LLM produces a final text response.

        Returns the assistant's final text reply.
        """
        self._message_history.append({
            "role": "user",
            "content": user_message,
        })

        for _ in range(MAX_TOOL_ITERATIONS):
            response = self._client.messages.create(
                model=self._model,
                max_tokens=4096,
                system=self._system_prompt(),
                tools=TOOL_DEFINITIONS,
                messages=self._message_history,
            )

            # Check if the response contains tool use
            tool_use_blocks = [
                b for b in response.content if b.type == "tool_use"
            ]
            text_blocks = [
                b for b in response.content if b.type == "text"
            ]

            if not tool_use_blocks:
                # Pure text response — we're done
                reply = "".join(b.text for b in text_blocks)
                self._message_history.append({
                    "role": "assistant",
                    "content": response.content,
                })
                return reply

            # Append the assistant message with tool_use blocks
            self._message_history.append({
                "role": "assistant",
                "content": response.content,
            })

            # Execute each tool and build tool_result messages
            tool_results = []
            for block in tool_use_blocks:
                result_str = self._execute_tool(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result_str,
                })

            self._message_history.append({
                "role": "user",
                "content": tool_results,
            })

        # Safety: if we hit max iterations, return whatever text we have
        return "I've processed your request but hit the analysis limit. Here's what I found so far based on the tools I ran."

    def run_pipeline(
        self,
        raw_events: list[dict[str, Any]],
        monthly_budget: float = 1000.0,
        spent_so_far: float = 0.0,
    ) -> dict[str, Any]:
        """
        Deterministic pipeline — skips the LLM loop and runs tools directly.
        Use this for the dashboard/forecast endpoints where we don't need
        conversational reasoning, just structured output.
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
        Coach chat endpoint. Wraps the orchestrator loop with chat context.
        """
        # Inject session context into the message if we have state
        context_parts = []
        if self._state.events:
            context_parts.append(
                f"User has {len(self._state.events)} upcoming events."
            )
        if self._state.forecast:
            context_parts.append(
                f"7-day predicted spend: ${self._state.forecast.next_7days_total:.0f}. "
                f"Risk: {self._state.forecast.risk_score.value}."
            )

        enriched_message = request.message
        if context_parts and not self._message_history:
            enriched_message = (
                f"[Context: {' '.join(context_parts)}]\n\n{request.message}"
            )

        reply_text = self.run(enriched_message)

        reply = ChatMessage(
            id=f"msg-{len(self._message_history)}",
            role="assistant",
            content=reply_text,
            timestamp=datetime.now().isoformat(),
        )

        # Extract any recommended actions from state
        actions = []
        if self._state.forecast and self._state.forecast.recommended_actions:
            actions = self._state.forecast.recommended_actions

        return ChatResponse(reply=reply, actions=actions)
