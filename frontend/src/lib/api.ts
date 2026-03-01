/**
 * API client — talks to the FastAPI backend.
 *
 * In development the Next.js rewrite proxies `/api/*` → `http://localhost:8000/api/*`
 * so we can use relative URLs and avoid CORS issues.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/*  Types  (mirrors backend schemas)                                   */
/* ------------------------------------------------------------------ */

export interface CalendarEventAPI {
  id: string;
  title: string;
  start: string;
  end: string;
  calendarType: string;
  location?: string;
  attendees?: number;
  predictedSpend?: number;
  category?: string;
  why?: string;
}

export interface DailyForecast {
  date: string;
  predictedSpend: number;
  food?: number;
  transport?: number;
  social?: number;
  entertainment?: number;
  other?: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  key: string;
}

export interface RecommendedAction {
  id: string;
  label: string;
  impact?: string;
  type?: string;
}

export interface ForecastResponse {
  next7DaysTotal: number;
  remainingBudget: number;
  monthlyBudget: number;
  riskScore: "LOW" | "MED" | "HIGH";
  daily: DailyForecast[];
  byCategory: CategoryBreakdown[];
  recommendedActions: RecommendedAction[];
}

export interface Insight {
  id: string;
  icon: string;
  title: string;
  description: string;
  type?: "spend" | "saving" | "habit" | "alert";
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  value: number;
  avatar?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  icon: string;
}

export interface Challenge {
  id: string;
  name: string;
  goal: number;
  unit: string;
  endDate: string;
  participants: number;
  joined?: boolean;
  progress?: number;
  streak?: number;
  description?: string;
  badges?: Badge[];
  leaderboard?: LeaderboardEntry[];
}

export interface ChallengesResponse {
  list: Challenge[];
  leaderboard: LeaderboardEntry[];
  badges: Badge[];
}

export interface ChatReply {
  id: string;
  role: "assistant";
  content: string;
  timestamp: string;
}

export interface CoachChatResponse {
  reply: ChatReply;
  actions?: RecommendedAction[];
}

export interface BankSummary {
  checking: number;
  vaults: Record<string, number>;
  total: number;
  recent_transactions: unknown[];
}

export interface PipelineResponse {
  events: CalendarEventAPI[];
  forecast: ForecastResponse;
  insights: Insight[];
  challenges: ChallengesResponse;
  aiSummary?: string;
}

/* ------------------------------------------------------------------ */
/*  API calls                                                          */
/* ------------------------------------------------------------------ */

/** One-shot demo dashboard — no request body needed */
export function fetchDemoDashboard() {
  return get<PipelineResponse>("/api/demo/dashboard");
}

/** AI-enhanced demo dashboard (requires GEMINI_API_KEY on backend) */
export function fetchDemoDashboardAI() {
  return get<PipelineResponse & { aiSummary: string }>("/api/demo/dashboard-ai");
}

/** Full pipeline with custom events / budget */
export function fetchPipeline(body: {
  events?: CalendarEventAPI[];
  monthly_budget?: number;
  spent_so_far?: number;
  session_id?: string;
}) {
  return post<PipelineResponse>("/api/pipeline", body);
}

/** Get enriched calendar events */
export function fetchEvents(body: {
  events?: CalendarEventAPI[];
  monthly_budget?: number;
  spent_so_far?: number;
}) {
  return post<CalendarEventAPI[]>("/api/events", body);
}

/** Get mock calendar events (no body) */
export function fetchCalendarEvents() {
  return get<CalendarEventAPI[]>("/api/calendar/events");
}

/** Get forecast only */
export function fetchForecast(body: {
  events?: CalendarEventAPI[];
  monthly_budget?: number;
  spent_so_far?: number;
}) {
  return post<ForecastResponse>("/api/forecast", body);
}

/** Get insights only */
export function fetchInsights(body: {
  events?: CalendarEventAPI[];
  monthly_budget?: number;
  spent_so_far?: number;
}) {
  return post<Insight[]>("/api/insights", body);
}

/** Get challenges only */
export function fetchChallenges(body: {
  events?: CalendarEventAPI[];
  monthly_budget?: number;
  spent_so_far?: number;
}) {
  return post<ChallengesResponse>("/api/challenges", body);
}

/** AI Coach chat */
export function sendCoachMessage(body: {
  message: string;
  session_id?: string;
  events?: CalendarEventAPI[];
  monthly_budget?: number;
}) {
  return post<CoachChatResponse>("/api/coach/chat", body);
}

/** Bank summary */
export function fetchBankSummary() {
  return get<BankSummary>("/api/bank/summary");
}

/** Lock funds in vault */
export function lockFunds(body: {
  amount: number;
  reason?: string;
  vault_name?: string;
}) {
  return post<{ ok: boolean; checking_after: number; vault_after: number }>(
    "/api/bank/lock",
    { action: "lock", ...body }
  );
}

/** Unlock funds from vault */
export function unlockFunds(body: {
  amount: number;
  reason?: string;
  vault_name?: string;
}) {
  return post<{ ok: boolean; checking_after: number; vault_after: number }>(
    "/api/bank/unlock",
    { action: "unlock", ...body }
  );
}
