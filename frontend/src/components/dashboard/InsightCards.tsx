"use client";

import {
  Car,
  UtensilsCrossed,
  TrendingDown,
  Calendar,
  Coffee,
  Sparkles,
  CreditCard,
  Target,
  LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

const ICON_MAP: Record<string, LucideIcon> = {
  Car,
  UtensilsCrossed,
  TrendingDown,
  Calendar,
  Coffee,
  Sparkles,
  CreditCard,
  Target,
};

interface Insight {
  id: string;
  icon: string;
  title: string;
  description: string;
  type?: string;
}

interface InsightCardsProps {
  insights: Insight[];
}

export function InsightCards({ insights }: InsightCardsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Insights</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((insight) => {
          const Icon = ICON_MAP[insight.icon] || Sparkles;
          return (
            <Card key={insight.id} className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                <Icon className="h-5 w-5 text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{insight.title}</p>
                <p className="text-sm text-slate-600">{insight.description}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
