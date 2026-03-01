"use client";

import { useState } from "react";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Crown,
  Medal,
  Star,
  Target,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
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
import { PageShell } from "@/components/layout/PageShell";

const extendedLeaderboard = [
  { rank: 1, id: "u1", name: "Jordan Lee", avatar: "JL", spent: 62, target: 274, status: "under" as const, avatarColor: "#10b981" },
  { rank: 2, id: "u2", name: "Alex Chen", avatar: "AC", spent: 85, target: 274, status: "under" as const, avatarColor: "#3b82f6", isCurrentUser: true },
  { rank: 3, id: "u3", name: "Sam Park", avatar: "SP", spent: 134, target: 274, status: "under" as const, avatarColor: "#8b5cf6" },
  { rank: 4, id: "u4", name: "Taylor Kim", avatar: "TK", spent: 198, target: 274, status: "under" as const, avatarColor: "#f59e0b" },
  { rank: 5, id: "u5", name: "Riley Nguyen", avatar: "RN", spent: 312, target: 274, status: "over" as const, avatarColor: "#ef4444" },
  { rank: 6, id: "u6", name: "Morgan Walsh", avatar: "MW", spent: 0, target: 274, status: "under" as const, avatarColor: "#06b6d4" },
];

const allTimeLeaderboard = [
  { rank: 1, name: "Jordan Lee", avatar: "JL", points: 3120, wins: 8, color: "#10b981" },
  { rank: 2, name: "Sam Park", avatar: "SP", points: 2780, wins: 7, color: "#8b5cf6" },
  { rank: 3, name: "Alex Chen", avatar: "AC", points: 2340, wins: 6, color: "#3b82f6", isCurrentUser: true },
  { rank: 4, name: "Morgan Walsh", avatar: "MW", points: 1950, wins: 5, color: "#06b6d4" },
  { rank: 5, name: "Taylor Kim", avatar: "TK", points: 1640, wins: 4, color: "#f59e0b" },
  { rank: 6, name: "Riley Nguyen", avatar: "RN", points: 890, wins: 2, color: "#ef4444" },
];

const activeChallenge = {
  name: "Weekend Warrior",
  target: 274,
  deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  reward: 650,
};

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"current" | "alltime">("current");

  const barData = extendedLeaderboard.map((p) => ({
    name: p.name.split(" ")[0],
    spent: p.spent,
    target: p.target,
    color: p.avatarColor,
    isCurrentUser: "isCurrentUser" in p && p.isCurrentUser,
  }));

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-slate-400 fill-slate-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600 fill-amber-600" />;
    return <span className="text-sm text-slate-500 w-4 text-center">{rank}</span>;
  };

  const daysRemaining = Math.ceil((new Date(activeChallenge.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-12 -left-6 w-48 h-48 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-blue-200">Active Group Challenge</span>
                </div>
                <h2 className="text-white font-semibold mb-1">{activeChallenge.name}</h2>
                <p className="text-sm text-blue-200">Target: Stay under ${activeChallenge.target} this weekend</p>
              </div>
              <div className="text-right">
                <div className="text-3xl text-white font-bold">{daysRemaining}d</div>
                <p className="text-xs text-blue-200">remaining</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex -space-x-2">
                {extendedLeaderboard.slice(0, 5).map((p) => (
                  <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs" style={{ backgroundColor: p.avatarColor }}>
                    {p.avatar}
                  </div>
                ))}
              </div>
              <span className="text-sm text-blue-200">{extendedLeaderboard.length} participants competing</span>
              <div className="ml-auto flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-yellow-300 font-semibold">{activeChallenge.reward} pts prize</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {(["current", "alltime"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === tab ? "bg-white text-slate-800 shadow-sm font-medium" : "text-slate-500 hover:text-slate-700"}`}
            >
              {tab === "current" ? "Current Challenge" : "All-Time Rankings"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === "current" ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-slate-800 font-medium">Weekend Warrior Rankings</h3>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">Live · Updated now</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {extendedLeaderboard.map((participant) => {
                    const pct = Math.round((participant.spent / participant.target) * 100);
                    const isCurrentUser = "isCurrentUser" in participant && participant.isCurrentUser;
                    const isOver = participant.status === "over";
                    return (
                      <div key={participant.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${isCurrentUser ? "bg-blue-50/50" : "hover:bg-slate-50"}`}>
                        <div className="w-6 flex justify-center flex-shrink-0">{getRankIcon(participant.rank)}</div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ backgroundColor: participant.avatarColor }}>
                          {participant.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm text-slate-800 ${isCurrentUser ? "font-semibold" : ""}`}>
                              {participant.name}
                              {isCurrentUser && <span className="ml-1 text-blue-600">(You)</span>}
                            </p>
                          </div>
                          <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden w-32">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isOver ? "#ef4444" : participant.avatarColor }} />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-900 font-semibold">${participant.spent}</p>
                          <p className="text-xs text-slate-400">of ${participant.target}</p>
                        </div>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${isOver ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                          {isOver ? <><TrendingUp className="w-3 h-3" /> over</> : <><TrendingDown className="w-3 h-3" /> under</>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-slate-800 font-medium">All-Time Points Leaderboard</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {allTimeLeaderboard.map((participant) => (
                    <div key={participant.rank} className={`flex items-center gap-4 px-5 py-4 ${participant.isCurrentUser ? "bg-blue-50/50" : "hover:bg-slate-50"} transition-colors`}>
                      <div className="w-6 flex justify-center flex-shrink-0">{getRankIcon(participant.rank)}</div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0" style={{ backgroundColor: participant.color }}>
                        {participant.avatar}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm text-slate-800 ${participant.isCurrentUser ? "font-semibold" : ""}`}>
                          {participant.name}
                          {participant.isCurrentUser && <span className="ml-1 text-blue-600">(You)</span>}
                        </p>
                        <p className="text-xs text-slate-400">{participant.wins} challenge wins</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-slate-700 font-semibold">{participant.points.toLocaleString()} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-800 font-medium mb-4">Spending Comparison</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e2e8f0", borderRadius: 8 }} formatter={(v: number) => [`$${v}`, "Spent"]} />
                  <Bar dataKey="spent" radius={4}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.isCurrentUser ? "#3b82f6" : entry.color} opacity={entry.isCurrentUser ? 1 : 0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <span className="border-t-2 border-dashed border-red-400 w-3" /> Target: ${activeChallenge.target}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-800 font-medium mb-3">Your Position</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">AC</div>
                <div>
                  <p className="text-sm text-slate-800 font-semibold">Rank #2 of 6</p>
                  <p className="text-xs text-slate-400">$85 spent · $189 remaining</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">vs Jordan Lee (#1)</span>
                  <span className="text-red-500 flex items-center gap-1">
                    <ChevronUp className="w-3.5 h-3.5" /> +$23 behind
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">vs Sam Park (#3)</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <ChevronDown className="w-3.5 h-3.5" /> $49 ahead
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-amber-600" />
                <h3 className="text-amber-800 font-medium">AI Tip</h3>
              </div>
              <p className="text-xs text-amber-700">
                Skip the Jazz Concert this Friday and you will jump to <strong>#1</strong> on the leaderboard, saving $95 and putting you well under target!
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
