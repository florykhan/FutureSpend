"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  DollarSign,
  Clock,
  MapPin,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import eventsData from "@/mocks/events.json";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const CALENDAR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  work: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800" },
  personal: { bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-800" },
  social: { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-800" },
  health: { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-800" },
};

type EventItem = {
  id: string;
  title: string;
  start: string;
  end: string;
  calendarType: string;
  predictedSpend: number;
  category: string;
};
type NormalizedEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  calendar: string;
  predictedSpend: number;
  calendarType: string;
};

function normalizeEvent(ev: EventItem): NormalizedEvent {
  const start = new Date(ev.start);
  const end = new Date(ev.end);
  const date = ev.start.slice(0, 10);
  const time = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
  const duration = (end.getTime() - start.getTime()) / 60000;
  const calendar =
    ev.calendarType === "work"
      ? "Work"
      : ev.calendarType === "social"
        ? "Social"
        : ev.calendarType === "health"
          ? "Health"
          : "Personal";
  return {
    id: ev.id,
    title: ev.title,
    date,
    time,
    duration,
    calendar,
    predictedSpend: ev.predictedSpend ?? 0,
    calendarType: ev.calendarType,
  };
}

export default function CalendarPage() {
  const events = useMemo(
    () => (eventsData as EventItem[]).map(normalizeEvent),
    []
  );
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);
  const [activeCalendars, setActiveCalendars] = useState<string[]>([
    "Work",
    "Personal",
    "Social",
    "Health",
  ]);
  const weekLabel = "March 3–9, 2025";
  const filteredEvents = events.filter((e) => activeCalendars.includes(e.calendar));
  const totalPredicted = filteredEvents.reduce((s, e) => s + e.predictedSpend, 0);
  const dates = ["03", "04", "05", "06", "07", "08", "09"];
  const todayIndex = 0;

  const toggleCalendar = (cal: string) => {
    setActiveCalendars((prev) =>
      prev.includes(cal) ? prev.filter((c) => c !== cal) : [...prev, cal]
    );
  };

  const getEventStyle = (ev: NormalizedEvent) => {
    const [h, m] = ev.time.split(":").map(Number);
    const top = (h - 7) * 56 + m * (56 / 60);
    const height = Math.max(ev.duration * (56 / 60), 28);
    return { top, height };
  };

  const getDayIndex = (dateStr: string) => {
    const day = dateStr.slice(-2);
    return dates.indexOf(day);
  };

  return (
    <PageShell>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <h2 className="text-slate-900 font-semibold">{weekLabel}</h2>
            <button
              type="button"
              className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-primary-700">
                Predicted: <strong>${totalPredicted}</strong>
              </span>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-xs text-slate-500">Calendars:</span>
          {["Work", "Personal", "Social", "Health"].map((cal) => {
            const key = cal.toLowerCase();
            const colors = CALENDAR_COLORS[key] ?? CALENDAR_COLORS.personal;
            const isActive = activeCalendars.includes(cal);
            return (
              <button
                key={cal}
                type="button"
                onClick={() => toggleCalendar(cal)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-all ${
                  isActive
                    ? `${colors.bg} ${colors.border} ${colors.text}`
                    : "bg-slate-100 border-slate-200 text-slate-400"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: isActive
                      ? key === "work"
                        ? "#3b82f6"
                        : key === "social"
                          ? "#8b5cf6"
                          : key === "health"
                            ? "#ec4899"
                            : "#64748b"
                      : "#cbd5e1",
                  }}
                />
                {cal}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-[420px]">
            <div
              className="grid border-b border-slate-200"
              style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}
            >
              <div className="border-r border-slate-100" />
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className={`py-3 text-center border-r border-slate-100 last:border-r-0 ${
                    i === todayIndex ? "bg-primary-50" : ""
                  }`}
                >
                  <p className="text-xs text-slate-400">{day}</p>
                  <p
                    className={`text-sm mt-0.5 ${
                      i === todayIndex
                        ? "w-7 h-7 bg-primary-600 text-white rounded-full mx-auto flex items-center justify-center font-semibold"
                        : "text-slate-700"
                    }`}
                  >
                    {dates[i]}
                  </p>
                </div>
              ))}
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "480px" }}>
              <div className="relative" style={{ height: `${HOURS.length * 56}px` }}>
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-slate-100 flex"
                    style={{ top: `${(hour - 7) * 56}px` }}
                  >
                    <div className="w-[52px] flex-shrink-0 flex justify-end pr-2 pt-1">
                      <span className="text-xs text-slate-400">
                        {hour > 12 ? `${hour - 12}pm` : hour === 12 ? "12pm" : `${hour}am`}
                      </span>
                    </div>
                    <div className="flex-1 border-l border-slate-100" />
                  </div>
                ))}
                {filteredEvents.map((event) => {
                  const dayIdx = getDayIndex(event.date);
                  if (dayIdx < 0) return null;
                  const { top, height } = getEventStyle(event);
                  const colors = CALENDAR_COLORS[event.calendarType] ?? CALENDAR_COLORS.personal;
                  const colWidth = `calc((100% - 52px) / 7)`;
                  const leftOffset = `calc(52px + ${dayIdx} * (100% - 52px) / 7 + 2px)`;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className={`absolute rounded-lg px-2 py-1 border text-left overflow-hidden transition-all hover:shadow-md cursor-pointer ${colors.bg} ${colors.border} ${colors.text}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: leftOffset,
                        width: `calc((100% - 52px) / 7 - 4px)`,
                      }}
                    >
                      <p className="text-xs truncate font-semibold leading-tight">
                        {event.title}
                      </p>
                      {height > 36 && (
                        <p className="text-xs text-slate-500 mt-0.5">{event.time}</p>
                      )}
                      {height > 52 && event.predictedSpend > 0 && (
                        <p className={`text-xs ${colors.text} mt-0.5`}>
                          ~${event.predictedSpend}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="w-64 flex-shrink-0 space-y-4">
            {selectedEvent ? (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div
                      className={`inline-block px-2 py-0.5 rounded-full text-xs mb-2 ${CALENDAR_COLORS[selectedEvent.calendarType]?.bg ?? "bg-slate-100"} ${CALENDAR_COLORS[selectedEvent.calendarType]?.text ?? "text-slate-800"}`}
                    >
                      {selectedEvent.calendar}
                    </div>
                    <h3 className="text-slate-800 font-medium">{selectedEvent.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      {selectedEvent.date} at {selectedEvent.time} ({selectedEvent.duration}min)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-800 font-medium">
                      Predicted: ${selectedEvent.predictedSpend}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h3 className="text-slate-800 font-medium mb-3">Select an event</h3>
                <p className="text-sm text-slate-400">
                  Click any event on the calendar to see details and spending prediction.
                </p>
              </div>
            )}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-slate-800 font-medium mb-3">Week Summary</h3>
              <div className="space-y-2">
                {["Work", "Personal", "Social", "Health"].map((cal) => {
                  const evs = filteredEvents.filter((e) => e.calendar === cal);
                  const spend = evs.reduce((s, e) => s + e.predictedSpend, 0);
                  if (evs.length === 0) return null;
                  return (
                    <div key={cal} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{cal}</span>
                      <span className="text-xs font-medium text-slate-700">
                        {evs.length} events · ${spend}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t border-slate-100 pt-2 mt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total</span>
                  <span className="text-sm font-semibold text-slate-900">
                    ${totalPredicted}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
