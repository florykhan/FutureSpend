# Plan: Wire FutureSpend Frontend ↔ Backend

## Context
The frontend and backend are both built but not properly connected. Every page has a mock-data fallback pattern (`if !NEXT_PUBLIC_API_URL → use mocks`) but several critical gaps make the app feel fake:

1. **Coach AI has zero context** — `coachChat()` sends `events: []` so Gemini can't give calendar-specific advice
2. **Dashboard stats are hardcoded** — health score (74), points (2340), weekend target ($274) are constants
3. **`/api/dashboard/sankey` endpoint is missing** — frontend calls it, gets 404, falls back to client-side build
4. **Predictions skip toggles are dead** — toggling an event doesn't recalculate
5. **Settings budget is not used** — user sets monthly budget in settings but it's never passed to the pipeline
6. **Coach endpoint can hard-fail** — `/api/coach/chat` throws if `GEMINI_API_KEY` is unset
7. **Calendar defaults to wrong year** — frontend starts on March 2025 while demo API events are in March 2026
8. **AI Sidebar is missing context too** — global assistant still calls `coachChat()` with no events/budget
9. **Sankey fallback logic is fragile** — current fallback comparison uses object identity and can fail to update
10. **Budget only reaches some pages** — localStorage-only save is not enough unless dashboard fetches use it

Demo pages that matter: **Dashboard, Coach, Calendar/Predictions**.
Coach behavior: **silent on open, but context-loaded** (responds with specific advice when asked).

---

## Critical Files

| File | Role |
|------|------|
| `backend/main.py` | All FastAPI endpoints — add sankey + healthScore |
| `backend/agent/orchestrator.py` | Coach endpoint auto-context injection |
| `frontend/src/lib/api.ts` | Central API client — already has all methods |
| `frontend/src/app/coach/page.tsx` | Fix: load events on mount, pass to coachChat |
| `frontend/src/app/dashboard/page.tsx` | Fix: use healthScore from API |
| `frontend/src/app/predictions/page.tsx` | Fix: skip toggles call runPipeline |
| `frontend/src/app/settings/page.tsx` | Fix: save budget to localStorage |
| `frontend/src/app/calendar/page.tsx` | Fix: selected week should follow loaded event dates |
| `frontend/src/components/ai/AISidebar.tsx` | Fix: pass coach context/budget like coach page |
| `frontend/src/lib/sankey.ts` + dashboard page | Fix: stable Sankey fallback and update logic |

---

## Changes

### 1. Backend: Add `/api/dashboard/sankey` endpoint
**File:** `backend/main.py`

Add a new `GET /api/dashboard/sankey` endpoint that runs the pipeline on mock data and converts `forecast.byCategory` into Sankey nodes + links format matching what `api.ts` expects:

```python
@app.get("/api/dashboard/sankey")
def dashboard_sankey():
    orchestrator = _get_orchestrator("sankey")
    pipeline = orchestrator.run_pipeline(
        raw_events=_MOCK_CALENDAR_EVENTS,
        monthly_budget=1800.0,
        spent_so_far=620.0,
    )
    by_cat = pipeline["forecast"]["byCategory"]
    total = pipeline["forecast"]["next7DaysTotal"]
    # Node 0 = Income/Budget, Nodes 1..N = categories
    nodes = [{"name": "This Week", "value": total, "percentage": 100, "color": "#2E90FA"}]
    links = []
    for i, cat in enumerate(by_cat):
        pct = round(cat["value"] / total * 100, 1) if total > 0 else 0
        nodes.append({"name": cat["name"], "value": cat["value"], "percentage": pct, "color": ...})
        links.append({"source": 0, "target": i + 1, "value": cat["value"], "color": ..., "percentage": pct})
    return {"nodes": nodes, "links": links, "currencySymbol": "CA$"}
```

Colors to use: food=#F79009, transport=#2E90FA, social=#9E77ED, entertainment=#EC2222, other=#5C5C5C

### 2. Backend: Add `healthScore` to demo/dashboard response
**File:** `backend/main.py`

Compute a 0–100 health score in `demo_dashboard()` and `demo_dashboard_ai()`:

```python
def _compute_health_score(forecast: dict) -> int:
    remaining = forecast.get("remainingBudget", 0)
    budget = forecast.get("monthlyBudget", 1)
    ratio = remaining / budget  # 1.0 = perfect, 0 = overspent
    base = int(ratio * 80)      # max 80 from budget usage
    risk = forecast.get("riskScore", "MED")
    bonus = {"LOW": 20, "MED": 5, "HIGH": -10}.get(risk, 0)
    return max(0, min(100, base + bonus))
```

Then append to the return dict: `"healthScore": _compute_health_score(pipeline["forecast"])`

### 3. Backend: Auto-inject calendar context into coach
**File:** `backend/main.py` — `coach_chat()` endpoint

If `events` is empty when the coach is called, auto-run the pipeline with mock events first so Gemini always has context:

```python
@app.post("/api/coach/chat")
def coach_chat(request: CoachChatRequest):
    orchestrator = _get_orchestrator(request.session_id)

    # Auto-inject context if no events provided and session is cold
    events_to_use = request.events
    if not events_to_use and not orchestrator.state.events:
        events_to_use = _MOCK_CALENDAR_EVENTS  # use mock until real OAuth

    if events_to_use and not orchestrator.state.events:
        orchestrator.run_pipeline(
            raw_events=events_to_use,
            monthly_budget=request.monthly_budget,
        )
    ...
```

### 4. Frontend: Dashboard — use healthScore from API
**File:** `frontend/src/app/dashboard/page.tsx`

In the `api.getDashboard()` `.then()` block, add:
```typescript
if ((data as any).healthScore != null) {
  setHealthScore((data as any).healthScore as number);
}
```

Add `const [healthScore, setHealthScore] = useState(currentUser.healthScore)` at top.
Replace `const score = currentUser.healthScore` → `const score = healthScore`.

Note: this healthScore read itself needs no extra API client method; budget/query param updates are handled in section 8b.

### 5. Frontend: Coach — load events on mount, pass to AI
**File:** `frontend/src/app/coach/page.tsx`

This is the #1 most impactful fix. Add a `useEffect` that loads dashboard data on mount:

```typescript
const [calendarEvents, setCalendarEvents] = useState<unknown[]>([]);
const [monthlyBudget, setMonthlyBudget] = useState(1000);

useEffect(() => {
  if (!process.env.NEXT_PUBLIC_API_URL) return;
  api.getDashboard().then((data) => {
    setCalendarEvents(data.events ?? []);
    setMonthlyBudget(data.forecast?.monthlyBudget ?? 1000);
  }).catch(() => {});
}, []);
```

Then change the `api.coachChat(trimmed)` call to:
```typescript
api.coachChat(trimmed, "default", calendarEvents, monthlyBudget)
```

Now Gemini gets the actual calendar events and can say things like "Your birthday dinner at The Keg on Wednesday will cost ~$121 — want me to lock $100 in a vault now?"

### 6. Frontend: Predictions — wire skip toggles to recalculate
**File:** `frontend/src/app/predictions/page.tsx`

The page has event toggle state but doesn't recalculate on change. Add a `useEffect` that watches `skippedEvents`:

```typescript
useEffect(() => {
  if (!process.env.NEXT_PUBLIC_API_URL || !allEvents.length) return;
  const activeEvents = allEvents.filter(e => !skippedEvents.has(e.id));
  api.runPipeline(activeEvents, monthlyBudget)
    .then((data) => {
      setWhatIfTotal(data.forecast.next7DaysTotal);
    })
    .catch(() => {});
}, [skippedEvents]);
```

This makes the "what-if" prediction panel update in real-time when user toggles events.

### 7. Frontend: Settings — persist budget to localStorage
**File:** `frontend/src/app/settings/page.tsx`

On save, write to localStorage:
```typescript
localStorage.setItem("futurespend_budget", String(budget));
```

In coach and predictions pages, read it:
```typescript
const monthlyBudget = Number(localStorage.getItem("futurespend_budget") ?? 1800);
```

---

---

## 8. Missing Must-Have Additions (for a truly functional app)

### 8a. Backend: Coach reliability when Gemini key is missing
**Files:** `backend/main.py`, `backend/agent/orchestrator.py`

Current risk: `/api/coach/chat` throws when `GEMINI_API_KEY` is not set.

Add one of these paths (prefer A for demos):
1. **A (recommended): graceful fallback** — catch missing-key errors and return deterministic coach reply using existing pipeline state.
2. **B:** hard requirement + startup validation with clear error docs.

Minimum acceptance:
- `/api/coach/chat` returns HTTP 200 with a useful reply even without Gemini.
- If no session events exist, it still provides non-empty guidance using mock pipeline data.

### 8b. Backend + Frontend: Budget plumbing across the app
**Files:** `backend/main.py`, `frontend/src/lib/api.ts`, pages using `api.getDashboard()`

Current risk: settings budget is saved locally but dashboard endpoints still use fixed backend defaults.

Required changes:
- Add dashboard params:
  - `monthly_budget`
  - `spent_so_far` (optional)
- Update `api.getDashboard(...)` to pass budget from localStorage.
- Ensure these pages use budgeted dashboard data:
  - `dashboard`
  - `calendar`
  - `predictions`
  - `challenges`
  - `leaderboard`
  - `coach` preload
  - `AISidebar` preload/context

### 8c. Frontend: Predictions recalc with correct event shape
**File:** `frontend/src/app/predictions/page.tsx`

Current risk: page stores display rows, but recalculation needs raw event inputs.

Required changes:
- Keep dedicated `rawEvents` state from API (`start/end/title/calendarType/...`).
- Derive UI rows from `rawEvents`.
- On `skippedEvents` change, call `api.runPipeline(activeRawEvents, monthlyBudget)` and update:
  - what-if total
  - category breakdown

### 8d. Frontend: Calendar initial week must align with loaded data
**File:** `frontend/src/app/calendar/page.tsx`

Current risk: default selected date is March 2025 while backend events are March 2026.

Required changes:
- After events load, set selected week from first event date (or `new Date()` fallback).
- Remove hardcoded 2025 date.

### 8e. Frontend: AI Sidebar context parity with Coach page
**File:** `frontend/src/components/ai/AISidebar.tsx`

Current risk: global assistant still calls `api.coachChat(content.trim())` with no context.

Required changes:
- Preload dashboard events + budget once (same pattern as coach page).
- Pass `session_id`, `events`, and `monthly_budget` in AI sidebar coach calls.

### 8f. Frontend: Finish dashboard realism fixes
**File:** `frontend/src/app/dashboard/page.tsx`

Required changes:
- Keep `healthScore` state from API (already planned).
- Replace or explicitly mark hardcoded top stats (points, weekend target) as demo placeholders.
- Fix Sankey fallback overwrite logic to avoid object identity comparison.

### 8g. MCP server architecture safety
**File:** `backend/mcp_server.py`

Current risk: importing in-memory bank state from API process can diverge when backend and MCP run separately.

Required changes:
- MCP tools should call backend HTTP endpoints (`/api/bank/*`, `/api/demo/dashboard`, `/api/pipeline`) rather than sharing in-process objects.
- Keep MCP as API client, not a second source of truth.

---

---

## 9. MCP Server: Make it State-of-the-Art
**File:** `backend/mcp_server.py`

This is the showpiece for judges. Goal: when you open Claude Desktop and say *"analyze my week"* — Claude autonomously chains tools, locks vault money, and generates a challenge. No prompting needed.

### 9a. Add 3 new tools

**`get_bank_status`** — lets Claude check balance before suggesting locks:
```python
@mcp.tool()
def get_bank_status() -> str:
    """Check current checking balance and vault amounts before locking/unlocking funds.
    Always call this before vault_lock_unlock to verify sufficient funds.
    Returns: checking balance, vault balances, and last 5 transactions."""
```
Implementation note: call backend `/api/bank/summary` so MCP and API share one source of truth.

**`what_if_scenario(skip_event_ids: str)`** — toggles events to recalculate:
```python
@mcp.tool()
def what_if_scenario(skip_event_ids: str) -> str:
    """Recalculate 7-day forecast if specific events are skipped.
    Use this to answer 'how much would I save if I skip the birthday dinner?'

    Args:
        skip_event_ids: JSON array of event IDs to exclude from forecast (e.g. '["evt-4", "evt-6"]')
    Returns: new forecast total, savings amount, and updated category breakdown."""
```

**`weekly_brief`** — AI-in-AI: calls Gemini to write a human summary:
```python
@mcp.tool()
def weekly_brief() -> str:
    """Generate a natural-language weekly financial brief using AI.
    Requires full_dashboard or analyze_events + forecast_spending + get_insights to be called first.
    Returns a punchy 3-5 sentence paragraph with specific event names and dollar amounts."""
```
Uses `google.genai` client to call `gemini-2.0-flash` with the session state.

### 9b. Add MCP Prompts (key differentiator — most MCP servers skip this)

Prompts are reusable instruction templates that appear as slash commands in Claude Desktop:

```python
@mcp.prompt()
def analyze_and_protect() -> str:
    """Analyze this week's calendar and proactively protect my money."""
    return """You are FutureSpend, a financial co-pilot.

Use these tools IN ORDER:
1. full_dashboard — get the complete financial picture
2. get_bank_status — check available balance
3. For any event with predictedSpend > $50: call vault_lock_unlock with action="lock",
   amount = 80% of predicted spend, reason = "Pre-emptive lock for [event name]"
4. If social spending > $100 total: generate_challenges
5. Call weekly_brief to summarize what you did

Be specific — reference actual event names and dollar amounts."""
```

```python
@mcp.prompt()
def what_if_weekend() -> str:
    """Show me how much I'd save by skipping all weekend social events."""
    return """Use FutureSpend tools to:
1. Call full_dashboard to load current events
2. Identify all events on Saturday/Sunday with calendarType = 'social' or 'personal'
3. Call what_if_scenario with those event IDs
4. Compare the new total to the original and tell me the exact savings"""
```

### 9c. Upgrade resources to return live state

```python
@mcp.resource("futurespend://forecast/current")
def current_forecast() -> str:
    """Current 7-day forecast. Read this to understand spending context before making recommendations."""
    if _state["forecast"]:
        return json.dumps(_state["forecast"].model_dump(by_alias=True), indent=2, default=str)
    return json.dumps({"status": "No forecast yet. Call full_dashboard first."})

@mcp.resource("futurespend://insights/current")
def current_insights() -> str:
    """Current detected patterns. Read before generating challenges or vault commands."""
    if _state["insights"]:
        return json.dumps([i.model_dump() for i in _state["insights"]], indent=2)
    return json.dumps({"status": "No insights yet. Call full_dashboard first."})
```

### Demo script for judges
```
Claude Desktop → FutureSpend MCP connected

User: /analyze_and_protect

Claude: [calls full_dashboard] → sees Birthday dinner $121, Weekend brunch $61...
        [calls get_bank_status] → balance $2500 available
        [calls vault_lock_unlock lock $97 "Pre-emptive lock for Birthday dinner - Alex"]
        [calls vault_lock_unlock lock $49 "Pre-emptive lock for Weekend brunch"]
        [calls generate_challenges]
        [calls weekly_brief]

        "Done. I've locked $146 across 2 vaults to protect against your highest-risk
        events this week. Your birthday dinner at The Keg will likely run ~$121 for 6 people —
        $97 is now protected. I also started a 'Weekend Cook-Off' challenge to offset
        the $61 brunch. You have $728 remaining in budget."
```

---

## Execution Order
1. Backend core endpoints (1, 2, 3) — sankey + healthScore + coach context injection
2. Coach reliability (8a) — no hard failure when Gemini key is missing
3. Budget plumbing (7 + 8b) — settings budget must affect all dashboard-backed pages
4. Coach page + AI Sidebar context (5 + 8e)
5. Predictions recalculation with raw events (6 + 8c)
6. Calendar date alignment (8d) — remove hardcoded 2025 default
7. Dashboard realism cleanup (4 + 8f) — healthScore + Sankey fallback + hardcoded stat cleanup
8. Full app regression check (dashboard, calendar, predictions, coach, challenges, leaderboard, banking)
9. MCP server enhancements (9a, 9b, 9c) after app is stable
10. MCP architecture hardening (8g) — API-backed state only

---

## Verification

```bash
# Start backend
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Start frontend (new terminal)
cd frontend && npm run dev   # or bun dev

# API contract checks
curl -s http://localhost:8000/api/demo/dashboard | jq '.healthScore'
curl -s http://localhost:8000/api/dashboard/sankey | jq '.nodes | length'
curl -s -X POST http://localhost:8000/api/coach/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"what should I know about this week?"}' | jq '.reply.content'

# In browser at localhost:3000:
# 1. Dashboard health score comes from API (not fixed 74)
# 2. Sankey loads from endpoint, fallback still works if endpoint is down
# 3. Calendar opens on the week containing loaded events (no 2025/2026 mismatch)
# 4. Predictions toggle recalculates total and category breakdown
# 5. Coach page and AI sidebar both answer with event-aware context
# 6. Changing budget in settings changes forecast values across dashboard-backed pages
# 7. Challenges/Leaderboard/Banking continue working after budget + coach changes
```
