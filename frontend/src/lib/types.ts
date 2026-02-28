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
  badges?: Badge[];
  leaderboard?: LeaderboardEntry[];
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
