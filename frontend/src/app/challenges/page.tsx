"use client";

import { useState } from "react";
import {
  Trophy,
  Target,
  Star,
  Plus,
  Clock,
  Zap,
  TrendingDown,
  Flame,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import challengesData from "@/mocks/challenges.json";

function ProgressRing({
  value,
  max,
  size = 80,
  stroke = 8,
  color = "#10b981",
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
        stroke="#f1f5f9"
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

type ChallengeItem = {
  id: string;
  name: string;
  goal: number;
  unit: string;
  endDate: string;
  participants: number;
  joined?: boolean;
  progress?: number;
  streak?: number;
  description?: string;
};

const pastChallenges = [
  { id: "p1", name: "February Freeze", target: 350, actual: 312, reward: 800, status: "won" as const, month: "Feb 2025" },
  { id: "p2", name: "Coffee Cap", target: 60, actual: 58, reward: 200, status: "won" as const, month: "Feb 2025" },
  { id: "p3", name: "Entertainment Budget", target: 150, actual: 183, reward: 300, status: "lost" as const, month: "Jan 2025" },
];
const friendSuggestions = ["Jordan Lee", "Sam Park", "Taylor Kim", "Morgan Walsh"];

export default function ChallengesPage() {
  const { list } = challengesData as { list: ChallengeItem[] };
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChallenge, setNewChallenge] = useState({ name: "", target: "200", friends: [] as string[] });

  const toggleFriend = (friend: string) => {
    setNewChallenge((prev) => ({
      ...prev,
      friends: prev.friends.includes(friend)
        ? prev.friends.filter((f) => f !== friend)
        : [...prev.friends, friend],
    }));
  };

  const activeList = list.filter((c) => c.joined);
  const totalPoints = 2340;
  const challengesWon = "3 / 4";
  const totalSaved = "$347";

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-slate-900 font-semibold">Savings Challenges</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Gamified goals to keep your spending on track
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Challenge
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Points Earned", value: totalPoints.toLocaleString(), icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
            { label: "Challenges Won", value: challengesWon, icon: Trophy, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Total Saved", value: totalSaved, icon: TrendingDown, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-slate-700 font-medium mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Active Challenges
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeList.map((challenge) => {
              const current = challenge.progress ?? 0;
              const target = challenge.goal;
              const pct = target > 0 ? Math.round((current / target) * 100) : 0;
              const remaining = target - current;
              const isWarning = pct > 70;
              const ringColor = isWarning ? "#f59e0b" : "#10b981";
              const daysLeft = Math.max(
                0,
                Math.ceil(
                  (new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
              );

              return (
                <div
                  key={challenge.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-purple-500" />
                        <h3 className="text-slate-800 font-medium">{challenge.name}</h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        {challenge.description ?? `Target: ${challenge.goal} ${challenge.unit}`}
                      </p>
                    </div>
                    <div className="relative flex-shrink-0 ml-4">
                      <ProgressRing
                        value={current}
                        max={target}
                        size={72}
                        stroke={7}
                        color={ringColor}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xs font-bold text-slate-800">{pct}%</span>
                        <span className="text-xs text-slate-400" style={{ fontSize: "9px" }}>
                          used
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Spent</span>
                      <span className="font-semibold text-slate-900">${current}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Target</span>
                      <span className="font-semibold text-slate-900">${target}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Remaining</span>
                      <span
                        className={`font-semibold ${remaining > 0 ? "text-emerald-600" : "text-red-500"}`}
                      >
                        ${remaining > 0 ? remaining : 0}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {daysLeft > 0 ? `${daysLeft}d left` : "Ends soon"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-yellow-600 font-medium">
                        Earn {challenge.streak ? challenge.streak * 100 : 400} pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-slate-700 font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Challenge History
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {pastChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      challenge.status === "won" ? "bg-emerald-100" : "bg-red-100"
                    }`}
                  >
                    {challenge.status === "won" ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{challenge.name}</p>
                    <p className="text-xs text-slate-400">{challenge.month}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-700">
                      ${challenge.actual} <span className="text-slate-400">/ ${challenge.target}</span>
                    </p>
                    {challenge.status === "won" ? (
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-yellow-600">+{challenge.reward} pts</span>
                      </div>
                    ) : (
                      <span className="text-xs text-red-400">
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-slate-900 font-semibold">New Savings Challenge</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Challenge Name</label>
                <input
                  type="text"
                  value={newChallenge.name}
                  onChange={(e) =>
                    setNewChallenge((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g., Weekend Warrior"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Spending Target ($)</label>
                <input
                  type="number"
                  value={newChallenge.target}
                  onChange={(e) =>
                    setNewChallenge((p) => ({ ...p, target: e.target.value }))
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  AI-suggested target based on your prediction: $274
                </p>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-2 block flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Invite Friends
                </label>
                <div className="space-y-2">
                  {friendSuggestions.map((friend) => (
                    <button
                      key={friend}
                      type="button"
                      onClick={() => toggleFriend(friend)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-sm ${
                        newChallenge.friends.includes(friend)
                          ? "border-primary-300 bg-primary-50 text-primary-700"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary-200"
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
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-purple-700">
                      Estimated Reward
                    </span>
                  </div>
                  <p className="text-xs text-purple-600">
                    Complete this challenge and earn approximately{" "}
                    <strong>
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
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex items-center justify-center gap-2 font-medium"
              >
                <Zap className="w-4 h-4" /> Launch Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
