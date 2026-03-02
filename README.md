# 💰 FutureSpend — See Tomorrow, Save Today, Share Success

Built in 24 hours at a hackathon sponsored by **SFU CSSS** and **RBC**, FutureSpend is an **AI-powered personal finance and spending forecast system** that connects your calendar to spending predictions. The system analyzes upcoming events (meals, outings, transport), predicts likely spend by category, and surfaces insights, savings challenges, and an AI coach. It uses a **FastAPI backend** and **Next.js** frontend, with optional **Google Gemini** for natural-language advice.

---

## 🎯 Project Overview

The goal of this project is to:

- **Predict** spending from calendar events (dining, social, transport, entertainment) using a rules-based pipeline.
- **Surface** insights and recommended actions (e.g. trim one event to stay under budget).
- **Run** savings challenges and leaderboards with friends.
- **Chat** with an AI coach for budget and calendar advice (Gemini-powered when `GEMINI_API_KEY` is set).

This system addresses **calendar-driven financial awareness** — seeing your week’s spend before it happens and making small trade-offs. **Target users:** individuals and teams who want a lightweight, calendar-first view of upcoming expenses.

---

## 🌐 Live Demo

The app is deployed on **GitHub Pages** with the backend on **Render**. Try it here: **[https://florykhan.github.io/FutureSpend/](https://florykhan.github.io/FutureSpend/)**

**Backend API:** [https://futurespend.onrender.com](https://futurespend.onrender.com) — health check: `{"status":"ok","service":"futurespend"}`.

> ⚠️ **Note:**  
> On Render’s free tier the backend may **spin down** after inactivity; the first request can take 30–60 seconds. Refresh or wait and try again.

![Financial dashboard](./frontend/public/dashboard.png)
_Financial dashboard with spending forecasts, category insights, and budgeting metrics_

---

## ✨ Key Features

- **Calendar-driven pipeline** — Mock or real calendar events → parsing → category-based spend prediction → forecast, insights, and challenges.
- **Dashboard** — Health score, 7-day forecast, Sankey by category, spending history, and recommended actions.
- **Challenges & leaderboard** — Join savings challenges, track progress, and compete with friends (mock participants in demo).
- **Banking (demo)** — Checking balance, vaults, lock/unlock funds; wired for RBC-style APIs in production.
- **AI coach** — Chat with an assistant that uses your dashboard context; powered by **Google Gemini** when `GEMINI_API_KEY` is set.
- **Static export** — Frontend builds as a static site for GitHub Pages; no Node server required in production.

---

## 🧱 Repository Structure

```
FutureSpend/
│
├── .github/
│   └── workflows/
│       └── deploy-frontend.yml          # GitHub Actions: Next.js static export → GitHub Pages
│
├── backend/                             # FastAPI backend & prediction pipeline
│   ├── agent/                           # AI orchestration (Gemini coach)
│   │   ├── orchestrator.py              # Pipeline + chat loop
│   │   ├── schemas.py                   # Pydantic models
│   │   └── tools.py                     # Coach tools (vault, etc.)
│   ├── parser.py                        # Calendar event → features
│   ├── prediction.py                    # Spend prediction by category
│   ├── element_of_game.py               # Challenge generation
│   ├── leaderboard.py                   # Leaderboard calculation
│   ├── calendar_fetcher.py              # Calendar events (mock / Google)
│   ├── mock_bank.py                     # Demo bank balance & transactions
│   ├── main.py                          # FastAPI app & all routes
│   ├── requirements.txt                 # Python dependencies
│   ├── .env.example                     # GEMINI_API_KEY (optional)
│   └── .python-version                  # 3.11.7
│
├── frontend/                            # Next.js 14 frontend
│   ├── public/                          # Static assets
│   ├── src/
│   │   ├── app/                         # App Router pages
│   │   │   ├── page.tsx                 # Landing
│   │   │   ├── dashboard/               # Dashboard
│   │   │   ├── calendar/                # Calendar view
│   │   │   ├── challenges/              # Challenges & [id] detail
│   │   │   ├── coach/                   # AI coach chat
│   │   │   ├── banking/                 # Balance & vaults
│   │   │   ├── leaderboard/             # Leaderboard
│   │   │   ├── predictions/             # Predictions
│   │   │   └── settings/                # Settings
│   │   ├── components/                  # UI components
│   │   ├── lib/                         # API client, utils, types
│   │   ├── mocks/                       # Mock JSON data
│   │   └── styles/
│   ├── .env.example                     # NEXT_PUBLIC_API_URL
│   ├── next.config.js                   # Static export, basePath for GitHub Pages
│   └── package.json                     # Node dependencies
│
├── render.yaml                          # Render backend deployment (rootDir: backend)
├── .gitignore
├── LICENSE
└── README.md                            # This file
```

> 🗒️ **Note:**  
> The **backend** serves the API (FastAPI + uvicorn). The **frontend** is a Next.js app built with `output: 'export'` and deployed to GitHub Pages; it talks to the backend via `NEXT_PUBLIC_API_URL`.

---

## 🧰 Run Locally

You can run this project with **Python 3.11+** (backend) and **Node.js 20+** with **npm** (frontend).

### 1️⃣ Clone the repository

```bash
git clone https://github.com/florykhan/FutureSpend.git
cd FutureSpend
```

### 2️⃣ Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Runs at `http://localhost:8000`. Optional: copy `.env.example` to `.env` and set `GEMINI_API_KEY` for the AI coach.

### 3️⃣ Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local and set: NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

Runs at `http://localhost:3000`. With `NEXT_PUBLIC_API_URL` set, the frontend uses the backend for dashboard, calendar events, predictions, challenges, banking, AI coach, and leaderboard. Without it, the app runs with mock data only.

---

## 🔐 Environment Variables

**Backend (optional):** `GEMINI_API_KEY` — for AI coach and `/api/demo/dashboard-ai` summaries. Get a key at [Google AI Studio](https://aistudio.google.com/apikey).

**Frontend (optional):** `NEXT_PUBLIC_API_URL` — backend base URL (no trailing slash). Default when not set: `http://localhost:8000` in dev. **Required for production build** when deploying; set in GitHub Actions variables for GitHub Pages.

---

## 🧠 Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts, D3 (Sankey), Phosphor Icons.
- **Backend:** Python 3.11, FastAPI, Uvicorn, Pydantic, Google Genai (Gemini).
- **Infrastructure:** Render (backend), GitHub Pages (frontend via GitHub Actions).

---

## 🧾 License

MIT License. Feel free to use and modify with attribution. See the [`LICENSE`](./LICENSE) file for full details.

---

## 👤 Authors


**Ilian Khankhalaev**  
_BSc Computing Science, Simon Fraser University_  
📍 Vancouver, BC  |  [florykhan@gmail.com](mailto:florykhan@gmail.com)  |  [GitHub](https://github.com/florykhan)  |  [LinkedIn](https://www.linkedin.com/in/ilian-khankhalaev/)

**Nikolay Deinego**  
_BSc Computing Science, Simon Fraser University_  
📍 Vancouver, BC  | [GitHub](https://github.com/Deinick)  |  [LinkedIn](https://www.linkedin.com/in/nikolay-deinego/)

**Rushik Behal**  
_BSc Computing Science, Simon Fraser University_  
📍 Vancouver, BC  | [GitHub](https://github.com/Rushik-B)  |  [LinkedIn](https://www.linkedin.com/in/rushik-behal/)
