"use client";

import { Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { formatDate } from "@/lib/format";

interface ChallengeCardProps {
  id: string;
  name: string;
  goal: number;
  unit: string;
  endDate: string;
  participants: number;
  joined?: boolean;
  progress?: number;
  description?: string;
  onJoin?: (id: string) => void;
}

function formatGoal(goal: number, unit: string): string {
  if (unit === "CAD" || unit === "USD") return formatCurrency(goal);
  return `${goal} ${unit}`;
}

export function ChallengeCard({
  id,
  name,
  goal,
  unit,
  endDate,
  participants,
  joined,
  progress = 0,
  description,
  onJoin,
}: ChallengeCardProps) {
  const pct = goal > 0 ? Math.min(100, (progress / goal) * 100) : 0;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="rounded-lg bg-amber-50 p-2">
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{name}</h3>
            {description && <p className="text-sm text-slate-600">{description}</p>}
            <p className="mt-1 text-xs text-slate-500">
              Goal: {formatGoal(goal, unit)} · Ends {formatDate(endDate)}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <Users className="h-3.5 w-3" />
              {participants} participants
            </div>
          </div>
        </div>
        {joined ? (
          <div className="flex flex-col items-end gap-2">
            <span className="text-sm font-medium text-primary-600">
              {formatGoal(progress, unit)} / {formatGoal(goal, unit)}
            </span>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">Joined</span>
          </div>
        ) : (
          <Button size="sm" onClick={() => onJoin?.(id)}>
            Join
          </Button>
        )}
      </div>
    </Card>
  );
}
