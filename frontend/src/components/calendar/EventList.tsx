"use client";

import { EventCard } from "./EventCard";
import type { CalendarEvent } from "@/lib/types";

interface EventListProps {
  events: CalendarEvent[];
}

export function EventList({ events }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 py-12 text-center text-slate-500">
        No upcoming events with spending predictions.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
