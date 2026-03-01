import { Calendar } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { EventList } from "@/components/calendar/EventList";
import { fetchCalendarEvents } from "@/lib/api";
import eventsFallback from "@/mocks/events.json";
import type { CalendarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  let events: CalendarEvent[];

  try {
    // Fetch enriched events from backend
    const raw = await fetchCalendarEvents();
    events = raw as CalendarEvent[];
  } catch {
    // Fallback to local mocks if backend is unreachable
    events = eventsFallback as CalendarEvent[];
  }

  return (
    <PageShell>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
            <Calendar className="h-6 w-6 text-primary-600" aria-hidden />
            Calendar → Spending
          </h1>
          <p className="text-slate-600">Upcoming events with predicted spending</p>
        </div>
        <EventList events={events} />
      </div>
    </PageShell>
  );
}
