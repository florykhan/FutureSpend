"use client";

import { Trophy, Flame, Users, Target, Sunrise, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  Flame,
  Users,
  Target,
  Sunrise,
};

interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  icon: string;
}

interface BadgesGridProps {
  badges: Badge[];
}

export function BadgesGrid({ badges }: BadgesGridProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Badges</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {badges.map((badge) => {
          const Icon = ICON_MAP[badge.icon] || Trophy;
          return (
            <div
              key={badge.id}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors",
                badge.earned
                  ? "border-amber-200 bg-amber-50/50"
                  : "border-slate-100 bg-slate-50/30 opacity-75"
              )}
            >
              <div
                className={cn(
                  "rounded-full p-2",
                  badge.earned ? "bg-amber-100" : "bg-slate-200"
                )}
              >
                {badge.earned ? (
                  <Icon className="h-6 w-6 text-amber-600" />
                ) : (
                  <Lock className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <p className="text-xs font-medium text-slate-900">{badge.name}</p>
              <p className="text-xs text-slate-500">{badge.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
