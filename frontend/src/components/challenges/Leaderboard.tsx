"use client";

import { Medal, User } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  value: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  valueLabel?: string;
  valueFormat?: (v: number) => string;
}

export function Leaderboard({
  entries,
  valueLabel = "Saved",
  valueFormat = (v) => `$${v}`,
}: LeaderboardProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900">Leaderboard</h3>
      <ul className="space-y-1.5">
        {entries.map((entry) => (
          <li
            key={entry.rank}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              {entry.rank <= 3 ? (
                <Medal
                  className="h-4 w-4"
                  style={{
                    color:
                      entry.rank === 1
                        ? "#f59e0b"
                        : entry.rank === 2
                          ? "#94a3b8"
                          : "#cd7f32",
                  }}
                />
              ) : (
                <span className="w-4 text-center text-xs text-slate-400">{entry.rank}</span>
              )}
              <span className={entry.name === "You" ? "font-semibold text-primary-700" : ""}>
                {entry.name}
              </span>
            </div>
            <span className="text-sm font-medium text-slate-700">
              {valueFormat(entry.value)} {valueLabel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
