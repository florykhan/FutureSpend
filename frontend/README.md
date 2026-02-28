# FutureSpend — Frontend

Intelligent personal finance UI: calendar-driven spending forecast, insights, and gamified challenges.

## Tech stack

- **Next.js** (App Router) + **TypeScript**
- **TailwindCSS** for styling
- **Recharts** for charts
- **lucide-react** for icons

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `src/app/` — App Router pages (landing, dashboard, calendar, challenges, coach, settings)
- `src/components/` — Layout, UI, and feature components
- `src/mocks/` — JSON fixtures for demo (no backend required)
- `src/lib/` — Utils, types, constants

## Demo flow

1. **Landing** — Hero, “Connect Calendar” / “Upload CSV” (mocked), onboarding steps
2. **Dashboard** — Predicted spend, category breakdown, risk score, insights, recommended actions
3. **Calendar** — Upcoming events with predicted spending per event
4. **Challenges** — List, join, leaderboard, streaks, badges, create challenge
5. **AI Coach** — Chat UI with suggested prompts and mocked responses
6. **Settings** — Profile, budget, notification toggles, privacy

All data is mocked via `src/mocks/*.json`.
