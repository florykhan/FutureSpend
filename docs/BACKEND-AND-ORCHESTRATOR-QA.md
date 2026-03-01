# Backend & Orchestrator — Q&A

This document captures questions and answers about the FutureSpend backend and orchestrator.

---

## 1. How does my backend work? What is my backend? How does the orchestrator work and how is it helpful?

### Your question

> Okay, so I have a question. How does my backend work? What is my backend? Basically, I want you to explain it to me in simple language. Just tell me how my orchestrator works and what it even does, and how it is helpful. Just tell me in simple and concise words, but also make sure to include every single thing.

### Answer

**What your backend is**

Your backend is a **FastAPI app** called **FutureSpend**. It sits between:

- **Inputs:** Google Calendar (or mock) events, budget, and sometimes bank data  
- **Output:** Data and AI behavior for your Next.js frontend (dashboard, coach chat, vault, etc.)

So the backend is the **API + orchestration layer** that turns calendar + budget into forecasts, insights, challenges, and coach replies.

**What the orchestrator is**

The **orchestrator** (`agent/orchestrator.py`) is the “brain” of that layer:

- **One instance per session** (e.g. per user or per `session_id`). Sessions are stored in `_sessions` in `main.py`; `_get_orchestrator(session_id)` creates one if needed.
- It can run in two ways:
  1. **Deterministic pipeline** (no LLM) — fixed sequence of tools for dashboard data.
  2. **LLM loop** (chat) — Gemini decides which tools to call based on the user’s message.

So: **orchestrator = per-session brain that either runs a fixed pipeline or drives an LLM that uses tools.**

**How the orchestrator works**

**Session state**

Each orchestrator keeps a **SessionState**:

- **events** — calendar events with predicted spend, category, “why”
- **forecast** — 7‑day total, remaining budget, risk, daily/category breakdown, recommended actions
- **insights** — list of insights (e.g. transport spike, lunch spend, coffee habit)
- **challenges** — gamification (challenges, leaderboard, badges)
- **vault_commands** — lock/unlock commands the user (or LLM) requested
- **tool_errors** — errors from tool runs (for recovery/debugging)
- **retrospective** — optional session memory

**Tools (what the orchestrator can do)**

Tools live in `agent/tools.py`. They are **pure functions**: input → output, no LLM inside.

| Tool | What it does |
|------|----------------|
| **analyze_calendar_events** | Takes raw calendar events → enriches them with predicted spend, category (food/transport/entertainment/health/other), calendar type (work/personal/social/health), and a short “why” explanation. |
| **generate_forecast** | Uses enriched events + monthly budget + spent_so_far → 7‑day forecast: daily/category breakdown, risk (LOW/MED/HIGH), remaining budget, recommended actions (e.g. “cook weekend meals”, “skip 2 coffees”, “lock $X in vault”). |
| **generate_insights** | Uses events + forecast → list of insights (e.g. ride-share adding up, lunch spend, social events driving spend, coffee habit, weekend cooking savings, high burn alert, best days to save). |
| **create_vault_command** | Builds a lock/unlock command (amount, reason, vault name). In production this would call the bank (e.g. RBC); for now it’s just the command object. |
| **generate_challenges** | Uses insights → challenges (e.g. “No Coffee Week”, “Weekend Cook-off”, “March Saver”), leaderboard, badges. |

**Deterministic pipeline (dashboard)**

Used by `/api/pipeline`, `/api/events`, `/api/forecast`, `/api/insights`, `/api/challenges`, and the demo endpoints.

Flow:

1. **analyze_calendar_events(raw_events)** → enriched events → stored in `state.events`.
2. **generate_forecast(events, monthly_budget, spent_so_far)** → forecast → `state.forecast`.
3. **generate_insights(events, forecast)** → insights → `state.insights`.
4. **generate_challenge_from_insights(insights)** → challenges (and leaderboard/badges) → `state.challenges`.

No LLM. Same order every time. Returns **events, forecast, insights, challenges** in one payload (or the part the endpoint asks for).

**LLM loop (coach chat)**

Used by `/api/coach/chat`.

1. User message (and optionally session context) is appended to **history**.
2. **Gemini** is called with: system prompt (FutureSpend persona + rules), conversation history, and **tool definitions** (the five tools above).
3. Gemini can return:
   - **Text only** → that’s the reply; loop ends.
   - **Tool calls** → for each call the orchestrator checks preconditions, circuit breaker, executes the tool via `_dispatch_tool`, updates **SessionState**, captures errors in **tool_errors**, and appends tool results back into history.
4. Call Gemini again with the updated history; repeat until Gemini returns only text or you hit the iteration limit.

**Safety and order**

- **Preconditions:** Before running a tool, the orchestrator checks that required state is present (e.g. “events” for forecast, “events” + “forecast” for insights).
- **Circuit breaker:** If a tool fails too many times, the orchestrator stops calling it.
- **Error capture:** Tool errors (and tracebacks) are stored in `state.tool_errors`.

**How this is helpful**

- **Single place for logic:** All “calendar → money” logic goes through the orchestrator and its tools.
- **Dashboard in one call:** One pipeline run fills state and gives you everything for the dashboard.
- **Coach that can act:** The chat isn’t just text — the LLM can trigger analysis, forecast, insights, vault commands, and challenges by calling tools.
- **Session isolation:** Each session has its own orchestrator and state.
- **Stable + flexible:** Pipeline is deterministic and fast for the main UI; chat is flexible and tool-augmented for the coach.

**Quick summary**

- **Backend:** FastAPI app that turns calendar + budget (and optionally bank) into forecasts, insights, challenges, and coach replies.
- **Orchestrator:** Per-session “brain” that holds **SessionState** and runs **five tools** (analyze events → forecast → insights → vault command, challenges).
- **Pipeline:** Runs those tools in a **fixed order** with no LLM and returns events, forecast, insights, challenges for the dashboard.
- **Chat:** Runs a **Gemini loop** with the same tools; the LLM chooses which tools to call, the orchestrator checks preconditions, runs tools, updates state, and feeds results back until the LLM replies with text.

---

## 2. List of orchestrator tools, pre-context, data sources, and accuracy

### Your question

> Can you give me a list of all the tools that the Orchestrator has available and what is given as pre-context? Where is this data coming from, and if the data is fully correct and really detailed?

### Answer

**1. All tools available to the orchestrator**

| # | Tool name | Parameters | What it does |
|---|-----------|------------|--------------|
| 1 | **analyze_calendar_events** | `raw_events` (array of `{title, start, end?, location?, attendees?, calendarType?}`) | Turns raw calendar events into enriched events with predicted spend, category, `calendarType`, and a short “why” explanation |
| 2 | **generate_forecast** | `monthly_budget`, `spent_so_far` (optional) | Aggregates enriched events into a 7‑day forecast: daily totals, by category, risk score, remaining budget, recommended actions |
| 3 | **generate_insights** | (none; uses session state) | Produces insights from events + forecast (transport spikes, lunch spend, coffee habits, weekend cooking, risk, best days to save) |
| 4 | **create_vault_command** | `action` (lock/unlock), `amount`, `reason`, `vault_name` (optional) | Builds a vault lock/unlock command (no actual bank call yet) |
| 5 | **generate_challenges** | `user_name` (optional) | Builds challenges (No Coffee Week, Weekend Cook-off, March Saver), leaderboard, badges |

**2. Pre-context given to the LLM**

**A. System prompt (always)**

From `agent/orchestrator.py`:

- **Persona:** FutureSpend financial co‑pilot
- **Instructions:** Analyze calendar → forecast → insights; call `create_vault_command` / `generate_challenges` when relevant; be specific; reference events and dollar amounts; never give vague advice
- **Context:**
  - `current_date` — from `datetime.now().strftime("%Y-%m-%d")`
  - `session_context` — from `state.summary()`

**B. Session context summary (`state.summary()`)**

Built from `SessionState`, concatenated into one string, e.g.:

- If events loaded: `"X events loaded ($Y predicted)"`
- If forecast exists: `"Forecast: $X over 7 days, $Y remaining, risk= LOW|MED|HIGH"`
- If insights exist: `"N insights detected"`
- If challenges exist: `"N active challenges"`
- If vault commands exist: `"$X locked in vaults"`
- If tool errors exist: `"N tool errors in this session"`
- Otherwise: `"Fresh session — no data loaded yet."`

**C. First chat message (context injection)**

For the first message in a session, when `self._history` is empty and there’s session data, the message is prefixed with:

```
[Session context: <state.summary() string>]

<user's message>
```

**3. Where the data comes from**

| Data | Source | How it gets to the orchestrator |
|------|--------|----------------------------------|
| **Calendar events** | 1) Google Calendar (production): `calendar_fetcher.get_upcoming_events()` with OAuth 2) Mock: `_MOCK_CALENDAR_EVENTS` or `_MOCK_EVENTS_FOR_ENGINE` in `main.py` | Passed via requests (`/api/pipeline`, `/api/coach/chat`, `/api/demo/dashboard`) as `events` |
| **Monthly budget** | Request body (`monthly_budget`), default 1000 | From `PipelineRequest`, `CoachChatRequest`, or demo defaults (e.g. 1800) |
| **Spent so far** | Request body (`spent_so_far`), default 0 | Same as above |
| **Bank data** | Used only in `/calendar/analyze`, not in the orchestrator tools. Comes from `mock_bank.get_transactions()` and `mock_bank.get_balance()` | In-memory mock; real bank would be RBC API |

The orchestrator tools never call the bank. They only see: `raw_events` (from the caller), `monthly_budget` and `spent_so_far` (from the caller), and session state (events, forecast, insights, challenges, etc.). Bank data is used elsewhere in `main.py` to tweak predictions in `/calendar/analyze`, not inside the orchestrator.

**4. How correct and detailed is the data?**

**Correctness and realism**

- **Event classification:** Based on regex over titles (`dinner|lunch|coffee|uber|dentist|birthday|friends|...`). Events without matching keywords fall into “other”. Titles without those patterns can be misclassified.
- **Spend estimates:** Hardcoded heuristics in `_estimate_event_spend()`:
  - Coffee: $6 × attendees
  - Lunch: $22 + $12 per extra attendee
  - Dinner: $40 + $15 per extra attendee
  - Entertainment: ~$80–105
  - Transport: ~$18 (×1.4 for early/late hours)
  - Health: $0
  - Location bumps +5%, weekend food +15%
- **Challenges:** Fixed content (e.g. “No Coffee Week”, “March Saver”). Only existence and some details are driven by insights; amounts/goals are mostly hardcoded.
- **Leaderboard / badges:** Fully mock data. Leaderboard names (“Alex K.”, “Sam R.”, …) and values are hardcoded; badges are placeholders.

So it’s **rule-based and approximate**, not based on real spending or bank transactions.

**Level of detail**

- **Events:** Title, start, end, location, attendees, `calendarType` — only what the calendar provides. No historical spend, receipts, or real prices.
- **Insights:** Rule-triggered only (e.g. ≥3 transport events, lunch events, coffee events, weekend food, risk level, lowest-spend days). No ML or personal history.
- **Forecast:** Aggregates predicted spend by day and category. Numbers are internal estimates, not actuals.

**Summary table**

| Question | Answer |
|----------|--------|
| **Tools** | 5: `analyze_calendar_events`, `generate_forecast`, `generate_insights`, `create_vault_command`, `generate_challenges` |
| **Pre-context** | System prompt (persona + rules), `current_date`, `session_context` from `state.summary()`, and optional `[Session context: …]` prepended to the first chat message |
| **Data sources** | Raw events from Google Calendar or mock; `monthly_budget` and `spent_so_far` from requests; no direct bank data in orchestrator tools |
| **Accuracy / detail** | Heuristic and rule-based: regex classification, fixed spend rules, mock challenges/leaderboard/badges. Useful as prototypes, not as exact financial forecasts |

---

## 3. Export to markdown

### Your question

> give me all this context in a markdown file... like my questions and your responses

### Answer

This file. All questions and responses above are captured in `docs/BACKEND-AND-ORCHESTRATOR-QA.md`.
