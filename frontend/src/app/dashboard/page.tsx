"use client";

import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Trophy,
  Zap,
  Calendar,
  ArrowRight,
  Target,
  Heart,
  Star,
  AlertTriangle,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
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
const activeChallenges = [
  { id: "c1", name: "Weekend Warrior", current: 85, target: 274, reward: 650 },
  { id: "c2", name: "Dining Out Diet", current: 45, target: 180, reward: 400 },
];

const categoryColors: Record<string, string> = {
  Food: "#3b82f6",
  Transport: "#10b981",
  Social: "#f59e0b",
  Shopping: "#8b5cf6",
  Subscriptions: "#6b7280",
};

export default function DashboardPage() {
  const forecast = forecastData as {
    next7DaysTotal: number;
    remainingBudget: number;
    monthlyBudget: number;
    byCategory: { name: string; value: number; key: string }[];
  };
  const score = currentUser.healthScore;
  const scoreColor = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";

  const pieData = forecast.byCategory.map((c) => ({
    name: c.name,
    value: c.value,
    color: categoryColors[c.name] ?? "#6b7280",
  }));

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        {/* Welcome bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-slate-900 font-semibold">
              Good morning, {currentUser.name.split(" ")[0]}! 👋
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Here&apos;s your financial snapshot for this week.
            </p>
          </div>
          <Link
            href="/calendar"
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Zap className="w-4 h-4" />
            Predict This Week
          </Link>
        </div>

        {/* Top stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="w-3 h-3" />+{currentUser.healthScoreTrend}
              </span>
            </div>
            <div className="text-2xl font-semibold text-slate-900">{score}</div>
            <p className="text-xs text-slate-500 mt-0.5">Health Score</p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${score}%`, backgroundColor: scoreColor }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-600" />
              </div>
              <span className="flex items-center gap-1 text-xs text-red-500">
                <TrendingUp className="w-3 h-3" />+$26
              </span>
            </div>
            <div className="text-2xl font-semibold text-slate-900">
              ${forecast.next7DaysTotal}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Predicted This Week</p>
            <p className="text-xs text-slate-400 mt-1">82% confidence</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-xs text-slate-400">Silver Saver</span>
            </div>
            <div className="text-2xl font-semibold text-slate-900">
              {currentUser.points.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Total Points</p>
            <p className="text-xs text-slate-400 mt-1">660 pts to Gold</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs text-purple-600">2 active</span>
            </div>
            <div className="text-2xl font-semibold text-slate-900">$274</div>
            <p className="text-xs text-slate-500 mt-0.5">Weekend Target</p>
            <p className="text-xs text-slate-400 mt-1">$85 spent of $274</p>
          </div>
        </div>

        {/* Middle row: charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-800 font-medium">Predicted vs Actual Spending</h3>
              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                Last 9 weeks
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={spendingHistoryData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 8 }}
                  formatter={(value: number | null, name: string) => [
                    value != null ? `$${value}` : "In progress",
                    name === "predicted" ? "Predicted" : "Actual",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#colorPredicted)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorActual)"
                  dot={false}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-primary-500 rounded" />
                <span className="text-xs text-slate-500">Predicted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-emerald-500 rounded" />
                <span className="text-xs text-slate-500">Actual</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-800 font-medium">This Week</h3>
              <Link
                href="/calendar"
                className="text-xs text-primary-600 hover:underline flex items-center gap-1 font-medium"
              >
                Details <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex justify-center mb-3">
              <PieChart width={140} height={140}>
                <Pie
                  data={pieData}
                  cx={65}
                  cy={65}
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-800">${item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row: Active Challenges + Health Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-800 font-medium">Active Challenges</h3>
              <Link
                href="/challenges"
                className="text-xs text-primary-600 hover:underline flex items-center gap-1 font-medium"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-4">
              {activeChallenges.map((challenge) => {
                const pct = Math.round((challenge.current / challenge.target) * 100);
                const isWarning = pct > 75;
                return (
                  <div key={challenge.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-slate-700">{challenge.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isWarning && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className="text-xs text-slate-500">
                          ${challenge.current} / ${challenge.target}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: isWarning ? "#f59e0b" : "#10b981",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{pct}% of budget used</span>
                      <div className="flex items-center gap-1 text-xs text-yellow-600">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        {challenge.reward} pts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-800 font-medium">Health Score Trend</h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full border border-emerald-200">
                +{currentUser.healthScoreTrend} this month
              </span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart
                data={healthScoreHistory}
                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 8 }}
                  formatter={(v: number) => [`${v}/100`, "Health Score"]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#healthGrad)"
                  dot={{ fill: "#10b981", r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: "Spending Accuracy", value: "85%", color: "text-primary-600" },
                { label: "Challenge Win Rate", value: "75%", color: "text-purple-600" },
                { label: "Savings Rate", value: "68%", color: "text-emerald-600" },
              ].map((item) => (
                <div key={item.label} className="text-center bg-slate-50 rounded-lg p-2">
                  <div className={`text-sm font-semibold ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-tight">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Connect Calendar",
              icon: Calendar,
              path: "/calendar",
              color: "bg-primary-50 text-primary-700 border-primary-200",
            },
            {
              label: "New Prediction",
              icon: TrendingUp,
              path: "/calendar",
              color: "bg-purple-50 text-purple-700 border-purple-200",
            },
            {
              label: "Start Challenge",
              icon: Target,
              path: "/challenges",
              color: "bg-emerald-50 text-emerald-700 border-emerald-200",
            },
            {
              label: "Ask AI",
              icon: Zap,
              path: "/coach",
              color: "bg-amber-50 text-amber-700 border-amber-200",
            },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.path}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all hover:shadow-md ${action.color}`}
            >
              <action.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
