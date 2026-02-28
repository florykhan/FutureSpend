"""
FutureSpend API — FastAPI application.

Serves the AI orchestration layer between Google Calendar data
and the Next.js frontend. Preserves the original /predict endpoint
from the engine branch while adding the full agent-powered pipeline.
"""

from __future__ import annotations

from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent.orchestrator import Orchestrator
from agent.schemas import (
    CalendarEvent,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    ForecastResponse,
    Insight,
    RecommendedAction,
)

# Keep teammate's parser/prediction for backwards compat
from parser import parse_calendar_events
from prediction import predict_spending as run_prediction

app = FastAPI(
    title="FutureSpend",
    description="AI-powered financial forecasting from calendar data",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Per-session orchestrator instances (in production: keyed by user ID)
_sessions: dict[str, Orchestrator] = {}


def _get_orchestrator(session_id: str = "default") -> Orchestrator:
    if session_id not in _sessions:
        _sessions[session_id] = Orchestrator()
    return _sessions[session_id]


# ── Health ──────────────────────────────────────────────────────────────────


@app.get("/")
def health():
    return {"status": "ok", "service": "futurespend"}


# ── Original engine endpoint (preserved) ────────────────────────────────────


class LegacyEvent(BaseModel):
    title: str
    location: Optional[str] = None
    start_time: str
    attendees: Optional[int] = None


class LegacyPredictRequest(BaseModel):
    events: list[LegacyEvent]


class LegacyPredictResponse(BaseModel):
    predicted_total: float
    confidence: float
    breakdown: dict
    features: list[dict] = Field(default_factory=list)


@app.post("/predict", response_model=LegacyPredictResponse)
def predict_legacy(request: LegacyPredictRequest):
    """Original prediction endpoint from engine branch."""
    eventdict = [event.model_dump() for event in request.events]
    features = parse_calendar_events(eventdict)
    result = run_prediction(features)
    return {
        "predicted_total": result["total_predicted"],
        "confidence": result["confidence"],
        "breakdown": result["breakdown"],
        "features": features,
    }


# ── Agent-powered endpoints ─────────────────────────────────────────────────


class PipelineRequest(BaseModel):
    """Full pipeline request: raw calendar events + budget context."""

    events: list[dict[str, Any]]
    monthly_budget: float = 1000.0
    spent_so_far: float = 0.0
    session_id: str = "default"


@app.post("/api/pipeline")
def run_pipeline(request: PipelineRequest):
    """
    Deterministic pipeline — runs all tools in sequence without LLM.
    Returns the full dashboard payload: events, forecast, insights, challenges.
    This is the main endpoint the frontend should call on page load.
    """
    orchestrator = _get_orchestrator(request.session_id)
    return orchestrator.run_pipeline(
        raw_events=request.events,
        monthly_budget=request.monthly_budget,
        spent_so_far=request.spent_so_far,
    )


@app.post("/api/events", response_model=list[CalendarEvent])
def analyze_events(request: PipelineRequest):
    """Analyze calendar events and return enriched events with predictions."""
    orchestrator = _get_orchestrator(request.session_id)
    result = orchestrator.run_pipeline(
        raw_events=request.events,
        monthly_budget=request.monthly_budget,
        spent_so_far=request.spent_so_far,
    )
    return result["events"]


@app.post("/api/forecast")
def get_forecast(request: PipelineRequest):
    """Generate 7-day forecast from calendar events."""
    orchestrator = _get_orchestrator(request.session_id)
    result = orchestrator.run_pipeline(
        raw_events=request.events,
        monthly_budget=request.monthly_budget,
        spent_so_far=request.spent_so_far,
    )
    return result["forecast"]


@app.post("/api/insights")
def get_insights(request: PipelineRequest):
    """Generate insights from calendar events."""
    orchestrator = _get_orchestrator(request.session_id)
    result = orchestrator.run_pipeline(
        raw_events=request.events,
        monthly_budget=request.monthly_budget,
        spent_so_far=request.spent_so_far,
    )
    return result["insights"]


@app.post("/api/challenges")
def get_challenges(request: PipelineRequest):
    """Generate savings challenges from detected patterns."""
    orchestrator = _get_orchestrator(request.session_id)
    result = orchestrator.run_pipeline(
        raw_events=request.events,
        monthly_budget=request.monthly_budget,
        spent_so_far=request.spent_so_far,
    )
    return result["challenges"]


# ── Coach Chat (uses LLM orchestrator loop) ─────────────────────────────────


class CoachChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    events: list[dict[str, Any]] = Field(default_factory=list)
    monthly_budget: float = 1000.0


@app.post("/api/coach/chat")
def coach_chat(request: CoachChatRequest):
    """
    AI coach chat — uses the full LLM orchestrator loop.
    The LLM decides which tools to call based on the conversation.
    """
    orchestrator = _get_orchestrator(request.session_id)

    # If events provided and not yet analyzed, run pipeline first
    if request.events and not orchestrator.state.events:
        orchestrator.run_pipeline(
            raw_events=request.events,
            monthly_budget=request.monthly_budget,
        )

    chat_req = ChatRequest(message=request.message)
    result = orchestrator.chat(chat_req)

    return {
        "reply": result.reply.model_dump(),
        "actions": [a.model_dump() for a in result.actions],
    }


# ── Vault Commands ──────────────────────────────────────────────────────────


class VaultRequest(BaseModel):
    action: str  # "lock" | "unlock"
    amount: float
    reason: str
    vault_name: str = "default"
    session_id: str = "default"


@app.post("/api/vault")
def vault_action(request: VaultRequest):
    """
    Lock or unlock funds in a savings vault.
    In production, this calls the RBC banking API.
    """
    from agent.tools import create_vault_command

    cmd = create_vault_command(
        action=request.action,
        amount=request.amount,
        reason=request.reason,
        vault_name=request.vault_name,
    )
    return cmd.model_dump()
