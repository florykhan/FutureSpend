import { LayoutDashboard } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { SpendLineChart } from "@/components/dashboard/SpendLineChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { InsightCards } from "@/components/dashboard/InsightCards";
import { RecommendedActions } from "@/components/dashboard/RecommendedActions";
import { fetchDemoDashboard } from "@/lib/api";
import forecastFallback from "@/mocks/forecast.json";
import insightsFallback from "@/mocks/insights.json";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let forecast: {
    next7DaysTotal: number;
    remainingBudget: number;
    monthlyBudget: number;
    riskScore: "LOW" | "MED" | "HIGH";
    daily: { date: string; predictedSpend: number }[];
    byCategory: { name: string; value: number; key: string }[];
    recommendedActions?: { id: string; label: string; impact?: string; type?: string }[];
  };
  let insights: { id: string; icon: string; title: string; description: string }[];

  try {
    const data = await fetchDemoDashboard();
    forecast = data.forecast;
    insights = data.insights;
  } catch {
    // Fallback to local mocks if backend is unreachable
    forecast = forecastFallback as typeof forecast;
    insights = insightsFallback as typeof insights;
  }

  const actions = forecast.recommendedActions || [];

  return (
    <PageShell>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
            <LayoutDashboard className="h-6 w-6 text-primary-600" aria-hidden />
            Dashboard
          </h1>
          <p className="text-slate-600">Your 7-day spending forecast and insights</p>
        </div>

        <SummaryCards
          predictedSpend={forecast.next7DaysTotal}
          remainingBudget={forecast.remainingBudget}
          monthlyBudget={forecast.monthlyBudget}
          riskScore={forecast.riskScore}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Daily predicted spend</h3>
            <SpendLineChart data={forecast.daily} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Spend by category</h3>
            <CategoryBreakdown data={forecast.byCategory} />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <InsightCards insights={insights} />
          </div>
          <div>
            <RecommendedActions actions={actions} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
