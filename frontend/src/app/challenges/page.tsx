"use client";

import { type CSSProperties, useState, useEffect } from "react";
import {
  Trophy,
  Star,
  Plus,
  Clock,
  Lightning,
  TrendDown,
  Fire,
  CheckCircle,
  XCircle,
  UsersThree,
} from "@phosphor-icons/react";
import { PageShell } from "@/components/layout/PageShell";
import { api } from "@/lib/api";
import { getStoredMonthlyBudget } from "@/lib/preferences";
import { getDashboardTypographyVars } from "@/lib/typography";
import type { Challenge as DashboardChallenge, DashboardPayload } from "@/lib/types";
import { getChallengeCurrentSpend } from "@/lib/dashboard";

function ProgressRing({
  value,
  max,
  size = 80,
  stroke = 8,
  color = "#10A861",
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

export default function ChallengesPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [list, setList] = useState<DashboardChallenge[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState({ name: "", target: "200", friends: [] as string[] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!process.env.NEXT_PUBLIC_API_URL);

  useEffect(() => {
    let cancelled = false;

    api
      .getDashboard({ monthlyBudget: getStoredMonthlyBudget() })
      .then((data) => {
        if (cancelled) return;
        setDashboard(data);
        const ch = data.challenges?.list ?? [];
        setList(ch);
        setNewChallenge((prev) => ({
          ...prev,
          target: String(Math.round(data.forecast.next7DaysTotal)),
        }));
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFriend = (friend: string) => {
    setNewChallenge((prev) => ({
      ...prev,
      friends: prev.friends.includes(friend)
        ? prev.friends.filter((f) => f !== friend)
        : [...prev.friends, friend],
    }));
  };

  const activeList = list.filter((c) => c.joined);
  const pastChallenges = dashboard?.pastChallenges ?? [];
  const friendSuggestions = dashboard?.friendSuggestions ?? [];

  const wonCount = pastChallenges.filter((c) => c.status === "won").length;
  const totalPast = pastChallenges.length;
  const totalPoints = pastChallenges.reduce((s, c) => s + (c.status === "won" ? c.reward : 0), 0);
  const challengesWon = `${wonCount} / ${totalPast}`;
  const totalSaved = `$${pastChallenges.filter((c) => c.status === "won").reduce((s, c) => s + (c.target - c.actual), 0)}`;

  if (loading) {
    return (
      <PageShell>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-gray-500 text-sm font-medium">Loading challenges...</p>
        </div>
      </PageShell>
    );
  }

  if (!dashboard) {
    return (
      <PageShell>
        <div className="p-6 flex items-center justify-center min-h-[240px]">
          <div className="text-center space-y-2">
            <p className="text-gray-300 text-sm font-medium">
              Challenges data is unavailable.
            </p>
            <p className="text-gray-600 text-sm">
              {error ?? "Start the backend and set NEXT_PUBLIC_API_URL."}
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div
        className="p-6 lg:p-8 space-y-7 dashboard-typography"
        style={getDashboardTypographyVars() as CSSProperties}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent-purple/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-accent-purple" />
            </div>
            <div>
              <h2 className="text-white text-xl lg:text-2xl font-semibold tracking-tight">
                Savings Challenges
              </h2>
              <p className="text-base text-gray-500 font-normal">
                Gamified goals to keep your spending on track
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-accent-blue text-white px-5 py-2.5 rounded-lg hover:bg-accent-blue/80 transition-colors text-base font-semibold"
          >
            <Plus className="w-4.5 h-4.5" /> New Challenge
          </button>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up"
          style={{ animationDelay: "60ms" }}
        >
          {[
            { label: "Total Points Earned", value: totalPoints.toLocaleString(), icon: Star, color: "text-warning-strong", bg: "bg-warning-muted" },
            { label: "Challenges Won", value: challengesWon, icon: Trophy, color: "text-accent-purple", bg: "bg-accent-purple/15" },
            { label: "Total Saved", value: totalSaved, icon: TrendDown, color: "text-success", bg: "bg-success-muted" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-surface-1 border border-white/[0.06] rounded-xl p-5 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white font-mono tabular-nums">{stat.value}</p>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Active Challenges */}
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <h3 className="text-gray-200 text-lg font-medium mb-4 flex items-center gap-2">
            <Fire className="w-5 h-5 text-warning" />
            Active Challenges
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeList.map((challenge) => {
              const current = Math.round(getChallengeCurrentSpend(challenge));
              const target = challenge.goal;
              const pct = target > 0 ? Math.round((current / target) * 100) : 0;
              const remaining = target - current;
              const isWarning = pct > 70;
              const ringColor = isWarning ? "#F79009" : "#10A861";
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
              );

              return (
                <div
                  key={challenge.id}
                  className="bg-surface-1 border border-white/[0.06] rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Trophy className="w-5 h-5 text-accent-purple" />
                        <h3 className="text-gray-100 font-semibold text-base">{challenge.name}</h3>
                      </div>
                      <p className="text-sm text-gray-500 font-normal">
                        {challenge.description ?? `Target: ${challenge.goal} ${challenge.unit}`}
                      </p>
                    </div>
                    <div className="relative flex-shrink-0 ml-4">
                      <ProgressRing
                        value={current}
                        max={target}
                        size={88}
                        stroke={8}
                        color={ringColor}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-semibold text-white">{pct}%</span>
                        <span className="text-gray-500 text-xs">
                          used
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-base">
                      <span className="text-gray-400 font-medium">Spent</span>
                      <span className="font-semibold text-white font-mono tabular-nums">${current}</span>
                    </div>
                    <div className="flex items-center justify-between text-base">
                      <span className="text-gray-400 font-medium">Target</span>
                      <span className="font-semibold text-white font-mono tabular-nums">${target}</span>
                    </div>
                    <div className="flex items-center justify-between text-base">
                      <span className="text-gray-400 font-medium">Remaining</span>
                      <span
                        className={`font-semibold font-mono tabular-nums ${remaining > 0 ? "text-success" : "text-destructive"}`}
                      >
                        ${remaining > 0 ? remaining : 0}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500 font-normal">
                        {daysLeft > 0 ? `${daysLeft}d left` : "Ends soon"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-warning-strong fill-warning-strong" />
                      <span className="text-sm text-warning-strong font-semibold">
                        Earn {challenge.streak ? challenge.streak * 100 : 400} pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Challenge History */}
        <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
          <h3 className="text-gray-200 text-lg font-medium mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Challenge History
          </h3>
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {pastChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex items-center gap-4 px-5 py-4.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      challenge.status === "won" ? "bg-success-muted" : "bg-destructive-muted"
                    }`}
                  >
                    {challenge.status === "won" ? (
                      <CheckCircle className="w-5.5 h-5.5 text-success" />
                    ) : (
                      <XCircle className="w-5.5 h-5.5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-100">{challenge.name}</p>
                    <p className="text-sm text-gray-600 font-mono">{challenge.month}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base text-gray-200 font-semibold font-mono tabular-nums">
                      ${challenge.actual} <span className="text-gray-600">/ ${challenge.target}</span>
                    </p>
                    {challenge.status === "won" ? (
                      <div className="flex items-center gap-1.5 justify-end">
                        <Star className="w-3.5 h-3.5 text-warning-strong fill-warning-strong" />
                        <span className="text-sm text-warning-strong font-semibold">+{challenge.reward} pts</span>
                      </div>
                    ) : (
                      <span className="text-sm text-destructive font-normal">
                        Over by ${challenge.actual - challenge.target}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-2 border border-white/[0.08] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent-purple/20 rounded-lg flex items-center justify-center">
                  <Lightning className="w-4 h-4 text-accent-purple" />
                </div>
                <h3 className="text-white font-semibold">New Savings Challenge</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-300 text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block font-medium">Challenge Name</label>
                <input
                  type="text"
                  value={newChallenge.name}
                  onChange={(e) =>
                    setNewChallenge((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g., Weekend Warrior"
                  className="w-full border border-white/[0.08] bg-surface-3 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block font-medium">Spending Target ($)</label>
                <input
                  type="number"
                  value={newChallenge.target}
                  onChange={(e) =>
                    setNewChallenge((p) => ({ ...p, target: e.target.value }))
                  }
                  className="w-full border border-white/[0.08] bg-surface-3 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 font-mono"
                />
                <p className="text-xs text-gray-600 mt-1 font-normal">
                  AI-suggested target based on your prediction: ${Math.round(dashboard.forecast.next7DaysTotal)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block font-medium flex items-center gap-1">
                  <UsersThree className="w-3.5 h-3.5" /> Invite Friends
                </label>
                <div className="space-y-2">
                  {friendSuggestions.map((friend) => (
                    <button
                      key={friend}
                      type="button"
                      onClick={() => toggleFriend(friend)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-sm ${
                        newChallenge.friends.includes(friend)
                          ? "border-accent-blue/30 bg-accent-blue-muted text-accent-blue font-medium"
                          : "border-white/[0.06] bg-surface-3 text-gray-400 hover:border-white/[0.12] font-normal"
                      }`}
                    >
                      <span>{friend}</span>
                      {newChallenge.friends.includes(friend) && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {newChallenge.target && (
                <div className="bg-warning-muted border border-warning/15 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-warning-strong fill-warning-strong" />
                    <span className="text-sm font-semibold text-warning">
                      Estimated Reward
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-normal">
                    Complete this challenge and earn approximately{" "}
                    <strong className="text-white font-semibold">
                      {Math.round(parseInt(newChallenge.target || "0") * 2.5)} points
                    </strong>
                    .
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 border border-white/[0.08] text-gray-400 rounded-lg hover:bg-white/[0.04] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/80 transition-colors text-sm flex items-center justify-center gap-2 font-semibold"
              >
                <Lightning className="w-4 h-4" /> Launch Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
