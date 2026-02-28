import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Leaderboard } from "@/components/challenges/Leaderboard";
import { BadgesGrid } from "@/components/challenges/BadgesGrid";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { formatDate } from "@/lib/format";
import challengesData from "@/mocks/challenges.json";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function ChallengeDetailPage({ params }: Params) {
  const { id } = await params;
  const data = challengesData as {
    list: {
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
    }[];
    leaderboard: { rank: number; name: string; value: number }[];
    badges: { id: string; name: string; description: string; earned: boolean; icon: string }[];
  };

  const challenge = data.list.find((c) => c.id === id) || data.list[0];
  const pct = challenge.goal > 0 ? Math.min(100, ((challenge.progress || 0) / challenge.goal) * 100) : 0;

  function formatGoal(goal: number, unit: string) {
    if (unit === "CAD" || unit === "USD") return formatCurrency(goal);
    return `${goal} ${unit}`;
  }

  return (
    <PageShell>
      <div className="p-4 md:p-6 lg:p-8">
        <Link
          href="/challenges"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to challenges
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{challenge.name}</h1>
          {challenge.description && (
            <p className="mt-1 text-slate-600">{challenge.description}</p>
          )}
          <p className="mt-2 text-sm text-slate-500">
            Goal: {formatGoal(challenge.goal, challenge.unit)} · Ends {formatDate(challenge.endDate)}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <h3 className="mb-3 font-semibold text-slate-900">Your progress</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatGoal(challenge.progress || 0, challenge.unit)} / {formatGoal(challenge.goal, challenge.unit)}
                  </p>
                </div>
              </div>
            </Card>

            {challenge.streak != null && (
              <Card>
                <h3 className="mb-2 font-semibold text-slate-900">Streak</h3>
                <p className="text-2xl font-bold text-amber-600">{challenge.streak} days</p>
              </Card>
            )}

            <Leaderboard
              entries={data.leaderboard}
              valueLabel="saved"
              valueFormat={(v) => `$${v}`}
            />
          </div>
          <div>
            <BadgesGrid badges={data.badges} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
