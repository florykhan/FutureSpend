"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, Info } from "lucide-react";
import { formatCurrency, formatTime, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

const CALENDAR_LABELS: Record<string, string> = {
  work: "Work",
  personal: "Personal",
  social: "Social",
  health: "Health",
};

const CALENDAR_COLORS: Record<string, string> = {
  work: "bg-blue-100 text-blue-800",
  personal: "bg-slate-100 text-slate-800",
  social: "bg-violet-100 text-violet-800",
  health: "bg-pink-100 text-pink-800",
};

interface EventCardProps {
  event: CalendarEvent;
}

export function EventCard({ event }: EventCardProps) {
  const [showWhy, setShowWhy] = useState(false);
  const typeStyle = CALENDAR_COLORS[event.calendarType] || CALENDAR_COLORS.personal;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-slate-100 p-2">
            <CalendarIcon className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">{event.title}</h3>
            <p className="text-sm text-slate-500">
              {formatDate(event.start)} · {formatTime(event.start)} – {formatTime(event.end)}
            </p>
            <span
              className={cn(
                "mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                typeStyle
              )}
            >
              {CALENDAR_LABELS[event.calendarType]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.predictedSpend != null && event.predictedSpend > 0 && (
            <span className="text-lg font-semibold text-primary-600">
              {formatCurrency(event.predictedSpend)}
            </span>
          )}
          {event.why && (
            <button
              type="button"
              onClick={() => setShowWhy(!showWhy)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Why this prediction?"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {event.category && (
        <p className="mt-2 text-xs text-slate-500">
          Category: <span className="font-medium capitalize">{event.category}</span>
        </p>
      )}
      {showWhy && event.why && (
        <div className="mt-3 rounded-lg bg-primary-50 p-3 text-sm text-primary-800">
          <span className="font-medium">Why: </span>
          {event.why}
        </div>
      )}
    </div>
  );
}
