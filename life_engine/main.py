"""
FutureSpend API — FastAPI application.

Serves the AI orchestration layer between Google Calendar data
and the Next.js frontend. Preserves the original /predict endpoint
from the engine branch while adding the full agent-powered pipeline.
"""

from __future__ import annotations

from typing import Any, List, Optional

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
from element_of_game import generate_challenge
from leaderboard import calculate_leaderboard
from calendar_fetcher import get_upcoming_events
from mock_bank import get_balance, get_transactions

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


class ChallengeRequest(BaseModel):
    predicted_total:float
    user_id: Optional[str]='default_user'

class ChallengeResponse(BaseModel):
    challenge_id:str
    target_spending:float
    points:int
    suggested_friends:List[str]
    message:str

class Participant(BaseModel):
    name:str
    spent:float

class LeaderboardRequest(BaseModel):
    participants:List[Participant]
    challenge_target:Optional[float]=None

class LeaderboardEntry(BaseModel):
    name:str
    spent:float
    rank:int
    status:Optional[str]=None

class LeaderboardResponse(BaseModel):
    leaderboard:List[LeaderboardEntry]

@app.get("/")
def health():
    return {"status": "ok", "service": "futurespend"}


# ── Engine branch endpoints (game features) ─────────────────────────────────


@app.post("/leaderboard", response_model=LeaderboardResponse)
def leaderboard(request: LeaderboardRequest):
    participants_dict = [p.model_dump() for p in request.participants]
    result = calculate_leaderboard(participants_dict, request.challenge_target)
    return {"leaderboard": result}


@app.post("/challenge", response_model=ChallengeResponse)
def challenge(request: ChallengeRequest):
    mock_user_history = {
        "avg_weekly_spending": 200,
        "past_success_rate": 0.5,
        "friends": ["Emma", "Liam", "Olivia", "Noah"],
    }
    game = generate_challenge(request.predicted_total, mock_user_history)
    return game


# ── Bank-personalized prediction helper ─────────────────────────────────────


def _adjust_prediction_with_bank(prediction: dict, user_id: str = "user_123") -> dict:
    """
    Reads recent transactions from mock bank and adjusts predicted spending
    based on actual recent spending patterns.
    """
    txn_resp = get_transactions(user_id, limit=10)
    bal_resp = get_balance(user_id)

    if not txn_resp.data or not txn_resp.data.get("transactions"):
        return prediction

    transactions = txn_resp.data["transactions"]
    balance = bal_resp.data.get("balance", 0) if bal_resp.data else 0

    # Calculate recent daily average from spending transactions
    spending_txns = [t for t in transactions if t["amount"] < 0]
    if spending_txns:
        recent_avg = abs(sum(t["amount"] for t in spending_txns)) / max(len(spending_txns), 1)
    else:
        recent_avg = 0

    # Blend: 70% calendar prediction + 30% bank-history average (scaled to same event count)
    predicted_total = prediction["total_predicted"]
    bank_adjusted = round(0.7 * predicted_total + 0.3 * (recent_avg * len(prediction.get("breakdown", {}))), 2)

    return {
        **prediction,
        "total_predicted": bank_adjusted,
        "bank_adjusted": True,
        "bank_balance": balance,
        "recent_daily_avg": round(recent_avg, 2),
        "original_total": predicted_total,
    }


# ── Calendar → Parser → Predictor → Challenge (full flow) ──────────────────


class AnalyzeRequest(BaseModel):
    user_id: Optional[str] = "user_123"
    use_mock: Optional[bool] = True
    include_bank_data: Optional[bool] = True


_MOCK_EVENTS_FOR_ENGINE = [
    {"title": "Team lunch - Downtown", "location": "Earls Restaurant",
     "start_time": "2026-03-03T12:00:00", "attendees": 4},
    {"title": "Coffee with Sarah", "location": "Starbucks",
     "start_time": "2026-03-03T15:00:00", "attendees": 2},
    {"title": "Birthday dinner - Alex", "location": "The Keg Steakhouse",
     "start_time": "2026-03-05T19:00:00", "attendees": 6},
    {"title": "Uber to office", "location": "",
     "start_time": "2026-03-06T08:30:00", "attendees": 1},
    {"title": "Weekend brunch with friends", "location": "OEB Breakfast Co.",
     "start_time": "2026-03-08T11:00:00", "attendees": 3},
    {"title": "Movie night", "location": "Cineplex",
     "start_time": "2026-03-08T19:00:00", "attendees": 2},
    {"title": "Tim Hortons run", "location": "Tim Hortons",
     "start_time": "2026-03-04T07:30:00", "attendees": 1},
    {"title": "Starbucks before class", "location": "Starbucks",
     "start_time": "2026-03-05T08:00:00", "attendees": 1},
]


@app.post("/calendar/analyze")
def calendar_analyze(request: AnalyzeRequest):
    """
    Full engine pipeline in one call:
      1. Fetch events (Google Calendar or mock)
      2. Parse events into features
      3. Predict spending (optionally adjusted with bank data)
      4. Generate savings challenge
      5. Generate leaderboard with mock participants

    Returns all results combined.
    """
    # Step 1: Get events
    if request.use_mock:
        raw_events = _MOCK_EVENTS_FOR_ENGINE
    else:
        raw_events = get_upcoming_events()
        if not raw_events:
            raise HTTPException(status_code=502, detail="Could not fetch calendar events")

    # Step 2: Parse
    features = parse_calendar_events(raw_events)

    # Step 3: Predict
    prediction = run_prediction(features)

    # Step 3b: Optionally adjust with bank data
    if request.include_bank_data:
        prediction = _adjust_prediction_with_bank(prediction, request.user_id)

    # Step 4: Challenge
    challenge_result = generate_challenge(prediction["total_predicted"])

    # Step 5: Leaderboard (mock participants for demo)
    mock_participants = [
        {"name": "You", "spent": prediction["total_predicted"]},
        {"name": "Emma", "spent": round(prediction["total_predicted"] * 0.8, 2)},
        {"name": "Liam", "spent": round(prediction["total_predicted"] * 1.1, 2)},
        {"name": "Olivia", "spent": round(prediction["total_predicted"] * 0.6, 2)},
    ]
    leaderboard_result = calculate_leaderboard(
        mock_participants, challenge_result["target_spending"]
    )

    return {
        "events": raw_events,
        "features": features,
        "prediction": prediction,
        "challenge": challenge_result,
        "leaderboard": leaderboard_result,
    }


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


# ── Mock Bank API (demo — replaced by RBC in production) ──────────────────


class _MockBank:
    """In-memory bank ledger for the hackathon demo."""

    def __init__(self, balance: float = 2500.0) -> None:
        self.checking: float = balance
        self.vaults: dict[str, float] = {"default": 0.0}
        self.transactions: list[dict[str, Any]] = []

    def lock(self, amount: float, vault: str, reason: str) -> dict[str, Any]:
        if amount > self.checking:
            return {"ok": False, "error": "Insufficient funds"}
        self.checking -= amount
        self.vaults.setdefault(vault, 0.0)
        self.vaults[vault] += amount
        txn = {
            "type": "lock",
            "amount": amount,
            "vault": vault,
            "reason": reason,
            "checking_after": round(self.checking, 2),
            "vault_after": round(self.vaults[vault], 2),
        }
        self.transactions.append(txn)
        return {"ok": True, **txn}

    def unlock(self, amount: float, vault: str, reason: str) -> dict[str, Any]:
        vbal = self.vaults.get(vault, 0.0)
        if amount > vbal:
            return {"ok": False, "error": f"Vault '{vault}' only has ${vbal:.2f}"}
        self.vaults[vault] -= amount
        self.checking += amount
        txn = {
            "type": "unlock",
            "amount": amount,
            "vault": vault,
            "reason": reason,
            "checking_after": round(self.checking, 2),
            "vault_after": round(self.vaults[vault], 2),
        }
        self.transactions.append(txn)
        return {"ok": True, **txn}

    def summary(self) -> dict[str, Any]:
        return {
            "checking": round(self.checking, 2),
            "vaults": {k: round(v, 2) for k, v in self.vaults.items()},
            "total": round(self.checking + sum(self.vaults.values()), 2),
            "recent_transactions": self.transactions[-10:],
        }


_bank = _MockBank()


@app.get("/api/bank/summary")
def bank_summary():
    """Mock bank account summary — checking balance + vaults."""
    return _bank.summary()


@app.post("/api/bank/lock")
def bank_lock(request: VaultRequest):
    """Lock funds from checking into a vault."""
    return _bank.lock(request.amount, request.vault_name, request.reason)


@app.post("/api/bank/unlock")
def bank_unlock(request: VaultRequest):
    """Unlock funds from a vault back to checking."""
    return _bank.unlock(request.amount, request.vault_name, request.reason)


# ── Mock Calendar (demo data for frontend wiring) ─────────────────────────


_MOCK_CALENDAR_EVENTS: list[dict[str, Any]] = [
    {
        "id": "evt-1",
        "title": "Team lunch - Downtown",
        "start": "2026-03-03T12:00:00",
        "end": "2026-03-03T13:30:00",
        "calendarType": "work",
        "location": "Earls Restaurant",
        "attendees": 4,
    },
    {
        "id": "evt-2",
        "title": "Coffee with Sarah",
        "start": "2026-03-03T15:00:00",
        "end": "2026-03-03T16:00:00",
        "calendarType": "social",
    },
    {
        "id": "evt-3",
        "title": "Dentist appointment",
        "start": "2026-03-04T09:00:00",
        "end": "2026-03-04T10:00:00",
        "calendarType": "health",
    },
    {
        "id": "evt-4",
        "title": "Birthday dinner - Alex",
        "start": "2026-03-05T19:00:00",
        "end": "2026-03-05T22:00:00",
        "calendarType": "social",
        "attendees": 6,
        "location": "The Keg Steakhouse",
    },
    {
        "id": "evt-5",
        "title": "Uber to office (client meeting)",
        "start": "2026-03-06T08:30:00",
        "end": "2026-03-06T09:00:00",
        "calendarType": "work",
    },
    {
        "id": "evt-6",
        "title": "Weekend brunch with friends",
        "start": "2026-03-08T11:00:00",
        "end": "2026-03-08T13:00:00",
        "calendarType": "social",
        "attendees": 3,
        "location": "OEB Breakfast Co.",
    },
    {
        "id": "evt-7",
        "title": "Movie night — Dune 3",
        "start": "2026-03-08T19:00:00",
        "end": "2026-03-08T22:00:00",
        "calendarType": "personal",
        "attendees": 2,
    },
    {
        "id": "evt-8",
        "title": "Tim Hortons run",
        "start": "2026-03-04T07:30:00",
        "end": "2026-03-04T08:00:00",
        "calendarType": "personal",
    },
    {
        "id": "evt-9",
        "title": "Starbucks before class",
        "start": "2026-03-05T08:00:00",
        "end": "2026-03-05T08:30:00",
        "calendarType": "personal",
    },
    {
        "id": "evt-10",
        "title": "Uber to downtown hangout",
        "start": "2026-03-07T18:00:00",
        "end": "2026-03-07T18:30:00",
        "calendarType": "social",
    },
]


@app.get("/api/calendar/events")
def get_mock_calendar():
    """
    Returns mock calendar events for demo / frontend wiring.
    In production, this calls the Google Calendar API with OAuth.
    """
    return _MOCK_CALENDAR_EVENTS


@app.get("/api/demo/dashboard")
def demo_dashboard():
    """
    One-shot demo endpoint: takes mock calendar data, runs the full
    pipeline, and returns everything the frontend needs.
    No API key or calendar OAuth required.
    """
    orchestrator = _get_orchestrator("demo")
    return orchestrator.run_pipeline(
        raw_events=_MOCK_CALENDAR_EVENTS,
        monthly_budget=1800.0,
        spent_so_far=620.0,
    )


@app.get("/api/demo/dashboard-ai")
def demo_dashboard_ai():
    """
    Gemini-enhanced demo dashboard: runs the full pipeline, then asks
    Gemini to generate a natural-language weekly brief from the data.
    Returns both structured data and the AI summary.
    """
    import os

    from google import genai as genai_client

    orchestrator = _get_orchestrator("demo-ai")
    pipeline = orchestrator.run_pipeline(
        raw_events=_MOCK_CALENDAR_EVENTS,
        monthly_budget=1800.0,
        spent_so_far=620.0,
    )

    # Build a concise prompt with the pipeline data
    events_summary = "\n".join(
        f"- {e['title']}: ${e['predictedSpend']:.0f} ({e['category']})"
        for e in pipeline["events"]
    )
    insights_summary = "\n".join(
        f"- [{i['type']}] {i['title']}: {i['description']}"
        for i in pipeline["insights"]
    )
    actions_summary = "\n".join(
        f"- {a['label']} ({a['impact']})"
        for a in pipeline["forecast"].get("recommendedActions", [])
    )

    prompt = f"""\
You are FutureSpend, a sharp and friendly financial co-pilot.

Here is the user's week at a glance:

UPCOMING EVENTS:
{events_summary}

7-DAY FORECAST:
- Total predicted spend: ${pipeline['forecast']['next7DaysTotal']:.0f}
- Remaining budget: ${pipeline['forecast']['remainingBudget']:.0f} of ${pipeline['forecast']['monthlyBudget']:.0f}
- Risk level: {pipeline['forecast']['riskScore']}

INSIGHTS DETECTED:
{insights_summary}

RECOMMENDED ACTIONS:
{actions_summary}

Write a short, punchy weekly financial brief (3-5 sentences). Be specific — \
reference actual events and dollar amounts. End with one concrete action the \
user should take today. No bullet points, just flowing text. Keep it under 100 words."""

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", "")

    ai_summary = None
    if api_key:
        try:
            client = genai_client.Client(api_key=api_key)
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            ai_summary = response.text
        except Exception as e:
            ai_summary = f"[Gemini unavailable: {e}]"
    else:
        ai_summary = "[Set GEMINI_API_KEY in .env to enable AI summaries]"

    return {
        **pipeline,
        "aiSummary": ai_summary,
    }
