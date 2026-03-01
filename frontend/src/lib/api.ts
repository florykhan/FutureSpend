/**
 * FutureSpend API client.
 * Base URL: set NEXT_PUBLIC_API_URL in .env.local (e.g. http://localhost:8000).
 */

import type {
  CalendarEvent,
  ChatMessage,
  Challenge,
  DashboardPayload,
  LeaderboardEntry,
} from "@/lib/types";
import { getStoredMonthlyBudget } from "@/lib/preferences";
import { getStoredSessionId } from "@/lib/session";

interface DashboardQueryOptions {
  monthlyBudget?: number;
  spentSoFar?: number;
  sessionId?: string;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  method?: string;
  body?: unknown;
  cacheTtlMs?: number;
}

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const REQUEST_CACHE_PREFIX = "request:";
const DEFAULT_GET_CACHE_TTL_MS = 60_000;
const responseCache = new Map<string, CacheEntry>();
const inFlightGetRequests = new Map<string, Promise<unknown>>();

function getMethod(rawMethod?: string): string {
  return (rawMethod ?? "GET").toUpperCase();
}

function getCacheKey(method: string, url: string): string {
  return `${REQUEST_CACHE_PREFIX}${method}:${url}`;
}

function getCachedResponse<T>(cacheKey: string): T | null {
  const entry = responseCache.get(cacheKey);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(cacheKey);
    return null;
  }

  return entry.data as T;
}

function setCachedResponse(cacheKey: string, data: unknown, ttlMs: number): void {
  responseCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

function clearRequestCache(): void {
  responseCache.clear();
  inFlightGetRequests.clear();
}

const getBaseUrl = (): string => {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (typeof window === "undefined") {
    return "http://localhost:8000";
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8000";
  }

  return "";
};

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function buildDashboardQuery(options: DashboardQueryOptions = {}): string {
  const monthlyBudget = options.monthlyBudget ?? getStoredMonthlyBudget();
  return buildQueryString({
    monthly_budget: monthlyBudget,
    spent_so_far: options.spentSoFar,
    session_id: options.sessionId ?? getStoredSessionId(),
  });
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const base = getBaseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  const url = path.startsWith("http") ? path : `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const { method: rawMethod = "GET", body, cacheTtlMs = DEFAULT_GET_CACHE_TTL_MS, ...rest } = options;
  const method = getMethod(rawMethod);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(rest.headers as HeadersInit),
  };
  const cacheKey = getCacheKey(method, url);
  const shouldUseCache = method === "GET" && cacheTtlMs > 0;

  if (shouldUseCache) {
    const cached = getCachedResponse<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    const inFlight = inFlightGetRequests.get(cacheKey);
    if (inFlight) {
      return inFlight as Promise<T>;
    }
  }

  const executeRequest = async (): Promise<T> => {
    const res = await fetch(url, {
      ...rest,
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${method} ${path}: ${res.status} ${text}`);
    }

    const payload = res.headers.get("content-type")?.includes("application/json")
      ? ((await res.json()) as T)
      : (undefined as unknown as T);

    if (shouldUseCache) {
      setCachedResponse(cacheKey, payload, cacheTtlMs);
    } else if (method !== "GET") {
      // Mutating requests invalidate cached reads to prevent stale UI.
      clearRequestCache();
    }

    return payload;
  };

  if (!shouldUseCache) {
    return executeRequest();
  }

  const promise = executeRequest()
    .catch((error) => {
      const stale = getCachedResponse<T>(cacheKey);
      if (stale !== null) {
        return stale;
      }
      throw error;
    })
    .finally(() => {
      inFlightGetRequests.delete(cacheKey);
    });

  inFlightGetRequests.set(cacheKey, promise as Promise<unknown>);
  return promise;
}

/** Check if the API is available (e.g. backend running). */
export async function healthCheck(): Promise<boolean> {
  try {
    const base = getBaseUrl();
    if (!base) return false;
    const res = await fetch(`${base.replace(/\/$/, "")}/`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  /** Cashflow Sankey data (pluggable — backend can return pre-built Sankey shape). */
  getSankey: (options: DashboardQueryOptions = {}) =>
    request<{
      nodes: Array<{ name: string; value: number; percentage: number; color: string }>;
      links: Array<{ source: number; target: number; value: number; color: string; percentage: number }>;
      currencySymbol: string;
    }>(`/api/dashboard/sankey${buildDashboardQuery(options)}`),

  /** Full dashboard payload (events, forecast, insights, challenges). No auth required. */
  getDashboard: (options: DashboardQueryOptions = {}) =>
    request<DashboardPayload>(`/api/dashboard${buildDashboardQuery(options)}`),

  /** Raw calendar events (no predictions). Use for pipeline input. */
  getCalendarEvents: () =>
    request<
      Array<{
        id: string;
        title: string;
        start: string;
        end?: string;
        calendarType?: string;
        location?: string;
        attendees?: number;
      }>
    >("/api/calendar/events"),

  /** Predict spending from a list of events. */
  predict: (events: Array<{ title: string; location?: string; start_time: string; attendees?: number }>) =>
    request<{
      predicted_total: number;
      confidence: number;
      breakdown: Record<string, number>;
      features?: unknown[];
    }>("/predict", { method: "POST", body: { events } }),

  /** Generate a savings challenge from predicted total. */
  createChallenge: (predicted_total: number, user_id?: string) =>
    request<{
      challenge_id: string;
      target_spending: number;
      points: number;
      suggested_friends: string[];
      message: string;
    }>("/challenge", { method: "POST", body: { predicted_total, user_id: user_id ?? "default_user" } }),

  /** Get leaderboard ranking. */
  getLeaderboard: (
    participants: Array<{ name: string; spent: number }>,
    challenge_target?: number
  ) =>
    request<{
      leaderboard: Array<{ name: string; spent: number; rank: number; status: string | null }>;
    }>("/leaderboard", { method: "POST", body: { participants, challenge_target } }),

  /** AI coach chat. */
  coachChat: (
    message: string,
    session_id = getStoredSessionId(),
    events: CalendarEvent[] = [],
    monthly_budget = getStoredMonthlyBudget()
  ) =>
    request<{
      reply: ChatMessage;
      actions: Array<{ id: string; label: string; impact: string; type: string }>;
    }>("/api/coach/chat", {
      method: "POST",
      body: { message, session_id, events, monthly_budget },
    }),

  /** Mock bank summary (checking, vaults, recent transactions). */
  bankSummary: () =>
    request<{
      checking: number;
      vaults: Record<string, number>;
      total: number;
      recent_transactions: Array<{
        type: string;
        amount: number;
        vault?: string;
        reason?: string;
        checking_after?: number;
        vault_after?: number;
      }>;
    }>("/api/bank/summary"),

  /** Lock funds into a vault. */
  bankLock: (amount: number, vault_name = "default", reason = "savings") =>
    request<{ ok: boolean; error?: string; checking_after?: number; vault_after?: number }>(
      "/api/bank/lock",
      {
        method: "POST",
        body: { action: "lock", amount, vault_name, reason, session_id: getStoredSessionId() },
      }
    ),

  /** Unlock funds from a vault. */
  bankUnlock: (amount: number, vault_name = "default", reason = "withdrawal") =>
    request<{ ok: boolean; error?: string; checking_after?: number; vault_after?: number }>(
      "/api/bank/unlock",
      {
        method: "POST",
        body: { action: "unlock", amount, vault_name, reason, session_id: getStoredSessionId() },
      }
    ),

  /** Run full pipeline with custom events (returns events, forecast, insights, challenges). */
  runPipeline: (
    events: CalendarEvent[],
    monthly_budget = getStoredMonthlyBudget(),
    spent_so_far = 0,
    session_id = getStoredSessionId()
  ) =>
    request<{
      events: CalendarEvent[];
      forecast: DashboardPayload["forecast"];
      insights: DashboardPayload["insights"];
      challenges: {
        list: Challenge[];
        leaderboard: LeaderboardEntry[];
        badges: DashboardPayload["challenges"]["badges"];
      };
    }>("/api/pipeline", {
      method: "POST",
      body: { events, monthly_budget, spent_so_far, session_id },
    }),
};
