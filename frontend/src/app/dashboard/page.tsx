"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Trophy,
  Calendar,
  ArrowRight,
  Target,
  Heart,
  Star,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { api } from "@/lib/api";
import forecastData from "@/mocks/forecast.json";

const currentUser = { name: "Alex Demo", healthScore: 74, healthScoreTrend: 6, points: 2340 };
const spendingHistoryData = [
  { week: "Jan W1", predicted: 320, actual: 298 },
  { week: "Jan W2", predicted: 410, actual: 445 },
  { week: "Jan W3", predicted: 380, actual: 362 },
  { week: "Jan W4", predicted: 290, actual: 278 },
  { week: "Feb W1", predicted: 350, actual: 341 },
  { week: "Feb W2", predicted: 420, actual: 389 },
  { week: "Mar W1", predicted: 412, actual: null },
];
const healthScoreHistory = [
  { date: "Oct", score: 52 },
  { date: "Nov", score: 58 },
  { date: "Dec", score: 61 },
  { date: "Jan", score: 67 },
  { date: "Feb", score: 68 },
  { date: "Mar", score: 74 },
];
const fallbackForecast = forecastData as {
  next7DaysTotal: number;
  remainingBudget: number;
  monthlyBudget: number;
  byCategory: Array<{ name: string; value: number; key: string }>;
};
const fallbackChallenges = [
  { id: "c1", name: "Weekend Warrior", current: 85, target: 274, reward: 650 },
  { id: "c2", name: "Dining Out Diet", current: 45, target: 180, reward: 400 },
];

const categoryColors: Record<string, string> = {
  Food: "#60a5fa",
  Transport: "#34d399",
  Social: "#fbbf24",
  Shopping: "#a78bfa",
  Subscriptions: "#71717a",
};

export default function DashboardPage() {
  const [forecast, setForecast] = useState(fallbackForecast);
  const [activeChallenges, setActiveChallenges] = useState(fallbackChallenges);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      setLoading(false);
      return;
    }
    api
      .getDashboard()
      .then((data) => {
        setForecast(data.forecast);
        const list = data.challenges?.list ?? [];
        if (list.length > 0) {
          setActiveChallenges(
            list.slice(0, 2).map((c: { id: string; name: string; goal: number }) => ({
              id: c.id,
              name: c.name,
              current: Math.round(c.goal * 0.35),
              target: c.goal,
              reward: 650,
            }))
          );
        }
      })
      .catch(() => {
        setForecast(fallbackForecast);
        setActiveChallenges(fallbackChallenges);
      })
      .finally(() => setLoading(false));
  }, []);

  const score = currentUser.healthScore;

  const pieData = (forecast.byCategory ?? []).map((c) => ({
    name: c.name,
    value: c.value,
    color: categoryColors[c.name] ?? "#71717a",
  }));

  const totalCategorySpend = pieData.reduce((s, c) => s + c.value, 0);

  if (loading) {
    return (
      <PageShell>
        <div className="p-8 flex items-center justify-center min-h-[200px]">
          <p className="text-zinc-500 text-sm">Loading&hellip;</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Greeting */}
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-up">
          <div>
            <h2 className="text-white text-xl font-bold tracking-tight" style={{ textWrap: "balance" }}>
              Good morning, {currentUser.name.split(" ")[0]}
            </h2>
            <p className="text-sm text-zinc-400 mt-1 font-medium">
              Your financial snapshot for this week.
            </p>
          </div>
          <Link
            href="/calendar"
            className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] text-zinc-200 px-4 py-2 rounded-lg hover:bg-white/[0.1] transition-colors text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            Predict This Week
          </Link>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: "60ms" }}>
          {/* Health Score */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <Heart className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              <span className="flex items-center gap-1 text-[11px] text-green-400 font-mono">
                <TrendingUp className="w-3 h-3" aria-hidden="true" />+{currentUser.healthScoreTrend}
              </span>
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">{score}</div>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Health Score</p>
            <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${score}%`,
                  backgroundColor: score >= 75 ? "#22c55e" : score >= 50 ? "#fbbf24" : "#ef4444",
                }}
              />
            </div>
          </div>

          {/* Predicted This Week */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              <span className="text-[11px] text-red-400 font-mono">+$26</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              ${forecast.next7DaysTotal}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Predicted This Week</p>
            <p className="text-[11px] text-zinc-600 mt-1 font-mono">82% confidence</p>
          </div>

          {/* Points */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <Star className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              <span className="text-[11px] text-zinc-500">Silver Saver</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {currentUser.points.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Total Points</p>
            <p className="text-[11px] text-zinc-600 mt-1 font-mono">660 pts to Gold</p>
          </div>

          {/* Weekend Target */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <Trophy className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              <span className="text-[11px] text-zinc-500">2 active</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">$274</div>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Weekend Target</p>
            <p className="text-[11px] text-zinc-600 mt-1 font-mono">$85 spent of $274</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
          {/* Spending Chart */}
          <div className="lg:col-span-2 bg-surface-1 border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[13px] text-zinc-200 font-semibold">Predicted vs Actual</h3>
              <span className="text-[11px] text-zinc-600 font-mono">Last 9 weeks</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={spendingHistoryData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: "#52525b" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#52525b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    background: "#1c1c1f",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    color: "#e4e4e7",
                  }}
                  formatter={(value: unknown, name: string) => [
                    value != null ? `$${value}` : "In progress",
                    name === "predicted" ? "Predicted" : "Actual",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#60a5fa"
                  strokeWidth={1.5}
                  fill="url(#gPredicted)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  fill="url(#gActual)"
                  dot={false}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-[2px] rounded bg-blue-400" />
                <span className="text-[11px] text-zinc-500">Predicted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-[2px] rounded bg-green-400" />
                <span className="text-[11px] text-zinc-500">Actual</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[13px] text-zinc-200 font-semibold">This Week</h3>
              <Link
                href="/calendar"
                className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                Details <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>

            {/* Horizontal stacked bar */}
            <div className="h-2 rounded-full overflow-hidden flex mb-5">
              {pieData.map((item) => (
                <div
                  key={item.name}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${(item.value / totalCategorySpend) * 100}%`,
                    backgroundColor: item.color,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>

            <div className="space-y-3">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color, opacity: 0.7 }}
                    />
                    <span className="text-[12px] text-zinc-400">{item.name}</span>
                  </div>
                  <span className="text-[12px] font-mono text-zinc-300 tabular-nums">${item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[12px] text-zinc-500">Total</span>
              <span className="text-[13px] font-mono font-medium text-zinc-200 tabular-nums">${totalCategorySpend}</span>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: "180ms" }}>
          {/* Active Challenges */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[13px] text-zinc-200 font-semibold">Active Challenges</h3>
              <Link
                href="/challenges"
                className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </Link>
            </div>
            <div className="space-y-5">
              {activeChallenges.map((challenge) => {
                const pct = Math.round((challenge.current / challenge.target) * 100);
                const isWarning = pct > 75;
                return (
                  <div key={challenge.id} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Trophy className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" aria-hidden="true" />
                        <span className="text-[13px] text-zinc-300 truncate">{challenge.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isWarning && (
                          <AlertTriangle className="w-3 h-3 text-amber-400" aria-hidden="true" />
                        )}
                        <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                          ${challenge.current} / ${challenge.target}
                        </span>
                      </div>
                    </div>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: isWarning ? "#fbbf24" : "#22c55e",
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-600">{pct}% of budget used</span>
                      <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                        {challenge.reward} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Health Score Trend */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[13px] text-zinc-200 font-semibold">Health Score Trend</h3>
              <span className="text-[11px] text-green-400/80 font-mono">
                +{currentUser.healthScoreTrend} this month
              </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={healthScoreHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#52525b" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[40, 100]}
                  tick={{ fontSize: 10, fill: "#52525b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    background: "#1c1c1f",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    color: "#e4e4e7",
                  }}
                  formatter={(v: number) => [`${v}/100`, "Health Score"]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  fill="url(#healthGrad)"
                  dot={{ fill: "#22c55e", r: 2.5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Spending Accuracy", value: "85%" },
                { label: "Challenge Win Rate", value: "75%" },
                { label: "Savings Rate", value: "68%" },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-2.5 text-center">
                  <div className="text-[13px] font-mono font-bold text-white tabular-nums">{item.value}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight font-medium">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-up" style={{ animationDelay: "240ms" }}>
          {[
            { label: "Connect Calendar", icon: Calendar, path: "/calendar" },
            { label: "New Prediction", icon: TrendingUp, path: "/calendar" },
            { label: "Start Challenge", icon: Target, path: "/challenges" },
            { label: "Ask AI", icon: MessageCircle, path: "/coach" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.path}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] hover:border-white/[0.1] transition-colors"
            >
              <action.icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-[12px] font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
