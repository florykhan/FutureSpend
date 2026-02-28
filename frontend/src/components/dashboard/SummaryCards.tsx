"use client";

import { TrendingUp, Wallet, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { RISK_COLORS } from "@/lib/constants";
import type { RiskLevel } from "@/lib/types";

interface SummaryCardsProps {
  predictedSpend: number;
  remainingBudget: number;
  monthlyBudget: number;
  riskScore: RiskLevel;
}

export function SummaryCards({
  predictedSpend,
  remainingBudget,
  monthlyBudget,
  riskScore,
}: SummaryCardsProps) {
  const riskColor = RISK_COLORS[riskScore];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-primary-500">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary-50 p-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Predicted (7 days)
            </p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(predictedSpend)}</p>
          </div>
        </div>
      </Card>
      <Card className="border-l-4 border-l-emerald-500">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-50 p-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Remaining budget
            </p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(remainingBudget)}</p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-100 p-2">
            <Wallet className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Monthly budget
            </p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(monthlyBudget)}</p>
          </div>
        </div>
      </Card>
      <Card className="border-l-4" style={{ borderLeftColor: riskColor }}>
        <div className="flex items-center gap-3">
          <div
            className="rounded-lg p-2"
            style={{ backgroundColor: `${riskColor}20` }}
          >
            <AlertTriangle className="h-5 w-5" style={{ color: riskColor }} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Risk score
            </p>
            <p className="text-xl font-bold" style={{ color: riskColor }}>
              {riskScore}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
