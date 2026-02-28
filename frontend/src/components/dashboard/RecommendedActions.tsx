"use client";

import { CheckCircle2, UtensilsCrossed, CreditCard, Target } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  cap: Target,
  habit: UtensilsCrossed,
  subscription: CreditCard,
};

interface Action {
  id: string;
  label: string;
  impact?: string;
  type?: string;
}

interface RecommendedActionsProps {
  actions: Action[];
}

export function RecommendedActions({ actions }: RecommendedActionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <span>Recommended actions</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.type ? ICON_MAP[action.type] : CheckCircle2;
          return (
            <div
              key={action.id}
              className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3"
            >
              {Icon && <Icon className="h-5 w-5 text-primary-600" />}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">{action.label}</p>
                {action.impact && (
                  <p className="text-xs text-slate-500">Impact: {action.impact}</p>
                )}
              </div>
              <Button variant="outline" size="sm">
                Apply
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
