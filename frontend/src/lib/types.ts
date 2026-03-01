export type RiskLevel = "LOW" | "MED" | "HIGH";

export type CalendarType = "work" | "personal" | "social" | "health";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  calendarType: CalendarType;
  predictedSpend?: number;
  category?: string;
  why?: string;
}

export interface ForecastDay {
  date: string;
  predictedSpend: number;
  categoryBreakdown?: Record<string, number>;
}

export interface Insight {
  id: string;
  icon: string;
  title: string;
  description: string;
  type?: "spend" | "saving" | "habit" | "alert";
}

export interface RecommendedAction {
  id: string;
  label: string;
  impact?: string;
  type?: "cap" | "habit" | "subscription";
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
  currentSpend?: number;
  reward?: number;
  badges?: Badge[];
  leaderboard?: LeaderboardEntry[];
  description?: string;
  deadline?: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  value: number;
  avatar?: string;
  isCurrentUser?: boolean;
  color?: string;
  points?: number;
  wins?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  email: string;
  monthlyBudget: number;
  notifications: {
    alertsBeforeEvents: boolean;
    weeklySummary: boolean;
  };
}

export interface DashboardStats {
  healthScoreTrend: number;
  weekOverWeekDelta: number;
  predictedConfidence: number;
  spendingAccuracy: number;
  challengeWinRate: number;
  savingsRate: number;
  totalSaved: number;
  challengesWon: number;
  totalChallenges: number;
}

export interface DashboardProfile {
  name: string;
  email: string;
  points: number;
  tier: string;
}

export interface HistoryPoint {
  week?: string;
  date?: string;
  predicted?: number | null;
  actual?: number | null;
  score?: number | null;
}

export interface PastChallenge {
  id: string;
  name: string;
  target: number;
  actual: number;
  reward: number;
  status: "won" | "lost";
  month: string;
}

export interface ForecastCategory {
  name: string;
  value: number;
  key: string;
}

export interface ForecastSummary {
  next7DaysTotal: number;
  remainingBudget: number;
  monthlyBudget: number;
  riskScore: RiskLevel;
  daily?: Array<{ date: string; predictedSpend: number; [k: string]: unknown }>;
  byCategory: ForecastCategory[];
  recommendedActions?: RecommendedAction[];
}

export interface DashboardPayload {
  events: CalendarEvent[];
  forecast: ForecastSummary;
  insights: Insight[];
  challenges: {
    list: Challenge[];
    leaderboard: LeaderboardEntry[];
    badges: Badge[];
  };
  healthScore: number;
  profile: DashboardProfile;
  dashboardStats: DashboardStats;
  spendingHistory: HistoryPoint[];
  healthScoreHistory: HistoryPoint[];
  pastChallenges: PastChallenge[];
  friendSuggestions: string[];
  allTimeLeaderboard: LeaderboardEntry[];
  leaderboardTip: string;
  activeChallenge?: Challenge;
  generatedAt: string;
}
