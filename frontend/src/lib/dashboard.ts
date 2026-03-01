import type {
  CalendarEvent,
  Challenge,
  DashboardPayload,
  ForecastCategory,
  LeaderboardEntry,
} from "@/lib/types";

export interface WhatIfScenario {
  id: string;
  label: string;
  eventId: string;
  savings: number;
  newTotal: number;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getChallengeCurrentSpend(challenge: Challenge): number {
  if (typeof challenge.currentSpend === "number") {
    return challenge.currentSpend;
  }
  return challenge.progress ?? 0;
}

export function getChallengeReward(challenge: Challenge): number {
  if (typeof challenge.reward === "number") {
    return challenge.reward;
  }
  return Math.max(250, Math.round(challenge.goal * 2.5));
}

export function buildPredictionBreakdown(breakdown: ForecastCategory[]) {
  const getValue = (key: string) =>
    breakdown.find((category) => category.key === key)?.value ?? 0;

  return {
    food: getValue("food"),
    entertainment: getValue("entertainment"),
    transport: getValue("transport"),
    other: getValue("other") + getValue("social") + getValue("health"),
  };
}

export function buildWhatIfScenarios(
  events: CalendarEvent[],
  baselineTotal: number
): WhatIfScenario[] {
  return [...events]
    .filter((event) => (event.predictedSpend ?? 0) > 0)
    .sort((a, b) => (b.predictedSpend ?? 0) - (a.predictedSpend ?? 0))
    .slice(0, 3)
    .map((event) => ({
      id: `scenario-${event.id}`,
      label: `Skip ${event.title}`,
      eventId: event.id,
      savings: Math.round(event.predictedSpend ?? 0),
      newTotal: Math.max(0, Math.round(baselineTotal - (event.predictedSpend ?? 0))),
    }));
}

export function getCurrentUserEntry(
  entries: LeaderboardEntry[],
  profileName: string
): LeaderboardEntry | undefined {
  return entries.find(
    (entry) => entry.isCurrentUser || entry.name === profileName
  );
}

export function getLeaderboardNeighbors(
  entries: LeaderboardEntry[],
  currentEntry?: LeaderboardEntry
): { leader?: LeaderboardEntry; trailing?: LeaderboardEntry } {
  if (!currentEntry) {
    return {};
  }
  return {
    leader: entries.find((entry) => entry.rank === currentEntry.rank - 1),
    trailing: entries.find((entry) => entry.rank === currentEntry.rank + 1),
  };
}

export function getActiveChallenge(payload: DashboardPayload): Challenge | undefined {
  return (
    payload.activeChallenge ??
    payload.challenges.list.find((challenge) => challenge.unit === "CAD") ??
    payload.challenges.list[0]
  );
}
