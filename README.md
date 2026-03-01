# mountain-madness-hackathon

## Running the full stack

1. **Backend** (FastAPI, port 8000):
   ```bash
   cd backend
   pip install -r requirements.txt  # if present
   uvicorn main:app --reload --port 8000
   ```

2. **Frontend** (Next.js):
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local and set: NEXT_PUBLIC_API_URL=http://localhost:8000
   npm install && npm run dev
   ```

With `NEXT_PUBLIC_API_URL` set, the frontend uses the backend for dashboard data, calendar events, predictions, challenges, banking (balance/vault lock-unlock), AI coach chat, and leaderboard. Without it, the app runs with mock data only.
