export const APP_NAME = "FutureSpend";
export const TAGLINE = "See Tomorrow, Save Today, Share Success";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/challenges", label: "Challenges" },
  { href: "/coach", label: "AI Coach" },
  { href: "/settings", label: "Settings" },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  food: "#10b981",
  transport: "#3b82f6",
  social: "#8b5cf6",
  shopping: "#f59e0b",
  health: "#ec4899",
  work: "#6366f1",
  subscriptions: "#64748b",
  other: "#94a3b8",
};

export const RISK_COLORS = {
  LOW: "#10b981",
  MED: "#f59e0b",
  HIGH: "#ef4444",
} as const;

export const SUGGESTED_PROMPTS = [
  "Why did I overspend this month?",
  "Can I afford going out this weekend?",
  "What's my biggest spending trigger?",
  "Suggest a savings goal for next month",
  "How does my spending compare to last month?",
];
