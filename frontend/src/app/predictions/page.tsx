"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { api } from "@/lib/api";
import eventsData from "@/mocks/events.json";
import predictionsData from "@/mocks/predictions.json";

const categoryColors: Record<string, string> = {
  food: "#60a5fa",
  meal: "#60a5fa",
  entertainment: "#fbbf24",
  transport: "#34d399",
  coffee: "#a78bfa",
  health: "#38bdf8",
  other: "#71717a",
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

type EventInput = { id: string; title: string; start: string; end?: string; predictedSpend?: number; category?: string; calendarType?: string };
function toEventRow(evt: EventInput): EventRow {
  const start = new Date(evt.start);
  return {
    id: evt.id,
    title: evt.title,
    date: new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(start),
    time: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(start),
    predictedSpend: evt.predictedSpend ?? 0,
    category: evt.category || "other",
    color: categoryColors[evt.category as keyof typeof categoryColors] || "#71717a",
    calendar: evt.calendarType || "other",
  };
}

const fallbackEvents = (eventsData as EventInput[]).map(toEventRow);
const fallbackPrediction = predictionsData.spendingPrediction;
const fallbackBreakdown = [
  { name: "Food", value: fallbackPrediction.breakdown.food, color: "#60a5fa" },
  { name: "Entertainment", value: fallbackPrediction.breakdown.entertainment, color: "#fbbf24" },
  { name: "Transport", value: fallbackPrediction.breakdown.transport, color: "#34d399" },
  { name: "Other", value: fallbackPrediction.breakdown.other, color: "#71717a" },
];

export default function PredictionsPage() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [skippedEvents, setSkippedEvents] = useState<Set<string>>(new Set());
  const [weeklyEvents, setWeeklyEvents] = useState<EventRow[]>(fallbackEvents);
  const [spendingPrediction, setSpendingPrediction] = useState(fallbackPrediction);
  const [breakdownData, setBreakdownData] = useState(fallbackBreakdown);
  const [loading, setLoading] = useState(!!process.env.NEXT_PUBLIC_API_URL);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      setLoading(false);
      return;
    }
    api
      .getDashboard()
      .then((data) => {
        if (data.events?.length) {
          const rows = data.events.map((e: EventInput) =>
            toEventRow({
              id: e.id,
              title: e.title,
              start: e.start,
              end: e.end,
              predictedSpend: e.predictedSpend,
              category: e.category,
              calendarType: e.calendarType,
            })
          );
          setWeeklyEvents(rows);
        }
        const pred = data.forecast;
        if (pred?.next7DaysTotal != null) {
          const total = pred.next7DaysTotal;
          const breakdown = pred.byCategory ?? [];
          setSpendingPrediction({
            total: Math.round(total),
            confidence: 0.82,
            lastWeekActual: fallbackPrediction.lastWeekActual,
            breakdown: {
              food: breakdown.find((c: { key: string }) => c.key === "food")?.value ?? 0,
              entertainment: breakdown.find((c: { key: string }) => c.key === "entertainment")?.value ?? 0,
              transport: breakdown.find((c: { key: string }) => c.key === "transport")?.value ?? 0,
              other: breakdown.find((c: { key: string }) => c.key === "other")?.value ?? 37,
            },
          });
          setBreakdownData(
            breakdown.length
              ? breakdown.map((c: { name: string; value: number }) => ({
                  name: c.name,
                  value: c.value,
                  color: categoryColors[c.name.toLowerCase()] ?? "#71717a",
                }))
              : fallbackBreakdown
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { whatIfScenarios } = predictionsData;
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
      setSkippedEvents((prev) => {
        const next = new Set(prev);
        next.add(scenario.eventId);
        return next;
      });
    }
  };

  const reset = () => {
    setSkippedEvents(new Set());
    setActiveScenario(null);
  };

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
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-up">
          {/* AI Prediction */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">AI Prediction</span>
            </div>
            <div className="text-3xl font-bold text-white font-mono tabular-nums">${spendingPrediction.total}</div>
            <p className="text-[12px] text-zinc-400 mt-1 font-medium">Original weekly estimate</p>
            <div className="mt-4 flex items-center gap-2.5">
              <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-400 rounded-full"
                  style={{ width: `${Math.round(spendingPrediction.confidence * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-500 font-mono tabular-nums">{Math.round(spendingPrediction.confidence * 100)}%</span>
            </div>
          </div>

          {/* What-If Total */}
          <div className={`rounded-xl p-5 border ${savings > 0 ? "bg-green-500/[0.06] border-green-500/[0.12]" : "bg-surface-1 border-white/[0.06]"}`}>
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">What-If Total</span>
            </div>
            <div className={`text-3xl font-bold font-mono tabular-nums ${savings > 0 ? "text-green-400" : "text-zinc-100"}`}>${currentTotal}</div>
            <p className="text-[12px] text-zinc-400 mt-1 font-medium">With your modifications</p>
            {savings > 0 && (
              <div className="mt-3 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
                <span className="text-[12px] text-green-400 font-medium font-mono">Saving ${savings}</span>
              </div>
            )}
          </div>

          {/* Last Week Actual */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">Last Week</span>
            </div>
            <div className="text-3xl text-zinc-100 font-semibold font-mono tabular-nums">${spendingPrediction.lastWeekActual}</div>
            <p className="text-[12px] text-zinc-400 mt-1 font-medium">Actual spending</p>
            <div className="mt-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
              <span className="text-[12px] text-red-400 font-mono">+${spendingPrediction.total - spendingPrediction.lastWeekActual} vs prediction</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "80ms" }}>
          {/* Event List */}
          <div className="lg:col-span-2 bg-surface-1 border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-[13px] text-zinc-200 font-semibold">Calendar Events This Week</h3>
              {skippedEvents.size > 0 && (
                <button
                  onClick={reset}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400 rounded"
                  type="button"
                >
                  <RefreshCw className="w-3 h-3" aria-hidden="true" /> Reset
                </button>
              )}
            </div>
            <div className="divide-y divide-white/[0.04]">
              {weeklyEvents.map((event) => {
                const isSkipped = skippedEvents.has(event.id);
                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isSkipped ? "opacity-40" : "hover:bg-white/[0.02]"}`}
                  >
                    <div
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoryColors[event.category] || "#71717a", opacity: 0.6 }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] text-zinc-300 ${isSkipped ? "line-through text-zinc-600" : ""} font-medium truncate`}>
                        {event.title}
                      </p>
                      <p className="text-[11px] text-zinc-600 mt-0.5 font-mono" suppressHydrationWarning>
                        {event.date} at {event.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-[13px] font-mono tabular-nums ${isSkipped ? "line-through text-zinc-600" : "text-zinc-300"} font-medium`}>
                        {event.predictedSpend > 0 ? `$${event.predictedSpend}` : "Free"}
                      </span>
                      <button
                        onClick={() => toggleSkip(event.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                          isSkipped
                            ? "bg-green-500/[0.12] text-green-400 hover:bg-green-500/20"
                            : "bg-white/[0.04] text-zinc-600 hover:bg-red-500/[0.12] hover:text-red-400"
                        }`}
                        title={isSkipped ? "Restore event" : "Skip event"}
                        aria-label={isSkipped ? `Restore ${event.title}` : `Skip ${event.title}`}
                        type="button"
                      >
                        {isSkipped ? <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> : <XCircle className="w-3.5 h-3.5" aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Category Breakdown */}
            <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-[13px] text-zinc-200 font-semibold mb-4">Category Breakdown</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={breakdownData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#52525b" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    width={80}
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
                    formatter={(v: unknown) => [`$${v}`, ""]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                    {breakdownData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* What-If Scenarios */}
            <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-[13px] text-zinc-200 font-semibold mb-1">What-If Scenarios</h3>
              <p className="text-[11px] text-zinc-600 mb-4">Apply a scenario to see your savings</p>
              <div className="space-y-2">
                {whatIfScenarios.map((scenario) => {
                  const isActive = activeScenario === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => applyScenario(scenario.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                        isActive
                          ? "border-green-500/20 bg-green-500/[0.06]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                      }`}
                      type="button"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[12px] text-zinc-300 ${isActive ? "font-medium" : ""}`}>{scenario.label}</span>
                        {isActive && <CheckCircle className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingDown className="w-3 h-3 text-green-400" aria-hidden="true" />
                        <span className="text-[11px] text-green-400/80 font-mono">Save ${scenario.savings} &rarr; ${scenario.newTotal}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            {savings > 0 && (
              <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
                <h3 className="text-[13px] text-white font-bold mb-1">Ready to save</h3>
                <p className="text-[11px] text-zinc-500 mb-3">
                  Turn your ${currentTotal} plan into a savings challenge and earn rewards.
                </p>
                <Link
                  href="/challenges"
                  className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/[0.1] text-zinc-200 px-3 py-2 rounded-lg text-[12px] font-medium hover:bg-white/[0.12] transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400"
                >
                  Create Challenge <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
