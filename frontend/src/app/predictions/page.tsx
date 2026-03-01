"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import eventsData from "@/mocks/events.json";
import predictionsData from "@/mocks/predictions.json";

const categoryColors: Record<string, string> = {
  food: "#3b82f6",
  meal: "#3b82f6",
  entertainment: "#f59e0b",
  transport: "#10b981",
  coffee: "#8b5cf6",
  health: "#06b6d4",
  other: "#6b7280",
};

type EventRow = {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  predictedSpend: number;
  category: string;
  color: string;
  calendar: string;
};

function toEventRow(evt: (typeof eventsData)[0]): EventRow {
  const start = new Date(evt.start);
  return {
    id: evt.id,
    title: evt.title,
    date: start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    time: start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    predictedSpend: evt.predictedSpend ?? 0,
    category: evt.category || "other",
    color: categoryColors[evt.category as keyof typeof categoryColors] || "#6b7280",
    calendar: evt.calendarType || "other",
  };
}

const weeklyEvents: EventRow[] = eventsData.map(toEventRow);

const breakdownData = [
  { name: "Food", value: predictionsData.spendingPrediction.breakdown.food, color: "#3b82f6" },
  { name: "Entertainment", value: predictionsData.spendingPrediction.breakdown.entertainment, color: "#f59e0b" },
  { name: "Transport", value: predictionsData.spendingPrediction.breakdown.transport, color: "#10b981" },
  { name: "Other", value: predictionsData.spendingPrediction.breakdown.other, color: "#6b7280" },
];

export default function PredictionsPage() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [skippedEvents, setSkippedEvents] = useState<Set<string>>(new Set());

  const { spendingPrediction, whatIfScenarios } = predictionsData;
  const currentTotal = weeklyEvents
    .filter((e) => !skippedEvents.has(e.id))
    .reduce((sum, e) => sum + e.predictedSpend, 0);
  const savings = spendingPrediction.total - currentTotal;

  const toggleSkip = (eventId: string) => {
    setSkippedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const applyScenario = (scenarioId: string) => {
    const scenario = whatIfScenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;
    if (activeScenario === scenarioId) {
      setActiveScenario(null);
      setSkippedEvents((prev) => {
        const next = new Set(prev);
        next.delete(scenario.eventId);
        return next;
      });
    } else {
      setActiveScenario(scenarioId);
      setSkippedEvents((prev) => new Set([...prev, scenario.eventId]));
    }
  };

  const reset = () => {
    setSkippedEvents(new Set());
    setActiveScenario(null);
  };

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm text-blue-200">AI Prediction</span>
            </div>
            <div className="text-3xl mb-1 font-bold">${spendingPrediction.total}</div>
            <p className="text-sm text-blue-200">Original weekly estimate</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-blue-500 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${Math.round(spendingPrediction.confidence * 100)}%` }}
                />
              </div>
              <span className="text-xs text-blue-200">{Math.round(spendingPrediction.confidence * 100)}% confidence</span>
            </div>
          </div>

          <div className={`rounded-xl p-5 border shadow-sm ${savings > 0 ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-slate-600">What-If Total</span>
            </div>
            <div className={`text-3xl mb-1 font-bold ${savings > 0 ? "text-emerald-700" : "text-slate-900"}`}>${currentTotal}</div>
            <p className="text-sm text-slate-500">With your modifications</p>
            {savings > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">Saving ${savings}!</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Last Week Actual</span>
            </div>
            <div className="text-3xl text-slate-900 mb-1 font-bold">${spendingPrediction.lastWeekActual}</div>
            <p className="text-sm text-slate-500">Actual spending</p>
            <div className="mt-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500">+${spendingPrediction.total - spendingPrediction.lastWeekActual} vs prediction</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 font-medium">Calendar Events This Week</h3>
              {skippedEvents.size > 0 && (
                <button onClick={reset} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {weeklyEvents.map((event) => {
                const isSkipped = skippedEvents.has(event.id);
                const catColor = categoryColors[event.category] || "#6b7280";
                const emoji = event.category === "meal" || event.category === "food" ? "🍽️" : event.category === "entertainment" ? "🎭" : event.category === "coffee" ? "☕" : event.category === "transport" ? "🚗" : "📅";
                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-4 px-5 py-3.5 transition-all ${isSkipped ? "opacity-50 bg-slate-50" : "hover:bg-slate-50"}`}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 text-xs" style={{ backgroundColor: catColor }}>
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm text-slate-800 ${isSkipped ? "line-through" : ""} font-medium`}>{event.title}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: event.color }}>
                          {event.calendar}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {event.date} at {event.time}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${isSkipped ? "line-through text-slate-400" : "text-slate-800"} font-semibold`}>
                        {event.predictedSpend > 0 ? `$${event.predictedSpend}` : "Free"}
                      </span>
                      <button
                        onClick={() => toggleSkip(event.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isSkipped ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500"}`}
                        title={isSkipped ? "Restore event" : "Skip event"}
                      >
                        {isSkipped ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-800 font-medium mb-4">Category Breakdown</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={breakdownData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} width={80} />
                  <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 8 }} formatter={(v: number) => [`$${v}`, ""]} />
                  <Bar dataKey="value" radius={4}>
                    {breakdownData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-800 font-medium mb-1">What-If Scenarios</h3>
              <p className="text-xs text-slate-400 mb-4">Apply a scenario to see your savings</p>
              <div className="space-y-3">
                {whatIfScenarios.map((scenario) => {
                  const isActive = activeScenario === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => applyScenario(scenario.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${isActive ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm text-slate-700 ${isActive ? "font-semibold" : ""}`}>{scenario.label}</span>
                        {isActive && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs text-emerald-600">Save ${scenario.savings} → new total ${scenario.newTotal}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {savings > 0 && (
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-white">
                <h3 className="text-white font-medium mb-1">Ready to save!</h3>
                <p className="text-xs text-purple-200 mb-3">Turn your ${currentTotal} plan into a savings challenge and earn rewards.</p>
                <Link href="/challenges" className="inline-flex items-center gap-2 bg-white text-purple-700 px-3 py-2 rounded-lg text-sm hover:bg-purple-50 transition-colors">
                  Create Challenge <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
