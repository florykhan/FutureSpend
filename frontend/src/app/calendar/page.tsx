"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  DollarSign,
  Users,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  weeklyCalendarEvents as MOCK_EVENTS,
  currentUser,
  type CalendarEventDisplay,
} from "../data/mockData";

/* ── Constants ────────────────────────────────────────────────────────────── */

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 am – 8 pm
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATES = [2, 3, 4, 5, 6, 7, 8]; // March 2–8, 2026
const TODAY_INDEX = 6;

const CALENDAR_TYPES = currentUser.connectedCalendars; // ["Work","Personal","Social","Health"]

const calendarColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Work:     { bg: "bg-blue-100",    border: "border-blue-300",    text: "text-blue-800",    dot: "#3b82f6" },
  Personal: { bg: "bg-purple-100",  border: "border-purple-300",  text: "text-purple-800",  dot: "#8b5cf6" },
  Health:   { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-800", dot: "#10b981" },
  Social:   { bg: "bg-amber-100",   border: "border-amber-300",   text: "text-amber-800",   dot: "#f59e0b" },
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Transform a backend enriched event (from /api/demo/dashboard → events[])
 * + optional raw event (from /api/calendar/events) into the shape the grid needs.
 */
function backendToDisplay(
  enriched: Record<string, any>,
  raw?: Record<string, any>,
): CalendarEventDisplay {
  const start: string = enriched.start ?? "";
  const end: string = enriched.end ?? "";
  const date = start.slice(0, 10);
  const time = start.slice(11, 16);

  let duration = 60;
  if (start && end) {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms > 0) duration = Math.round(ms / 60_000);
  }

  const calType: string = enriched.calendarType ?? "personal";

  return {
    id:             enriched.id ?? `evt-${Math.random().toString(36).slice(2, 8)}`,
    title:          enriched.title ?? "Untitled",
    date,
    time,
    duration,
    calendar:       capitalize(calType),
    predictedSpend: enriched.predictedSpend ?? 0,
    category:       enriched.category ?? "other",
    location:       raw?.location ?? enriched.location,
    attendees:      raw?.attendees ?? enriched.attendees ?? 1,
    why:            enriched.why,
  };
}

function getEventStyle(event: CalendarEventDisplay) {
  const [h, m] = event.time.split(":").map(Number);
  const top = ((h - 7) * 60 + m) * (56 / 60);
  const height = Math.max(event.duration * (56 / 60), 28);
  return { top, height };
}

function getDayIndex(dateStr: string) {
  const day = parseInt(dateStr.split("-")[2]);
  return DATES.indexOf(day);
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function Calendar() {
  const [events, setEvents]                 = useState<CalendarEventDisplay[]>([]);
  const [loading, setLoading]               = useState(true);
  const [backendLive, setBackendLive]       = useState(false);
  const [selectedEvent, setSelectedEvent]   = useState<CalendarEventDisplay | null>(null);
  const [activeCalendars, setActiveCalendars] = useState<string[]>(CALENDAR_TYPES);

  /* ── Fetch from backend on mount ─────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 1️⃣  Enriched events (with predictions, category, why)
        const dashRes = await fetch("/api/demo/dashboard", {
          signal: AbortSignal.timeout(5000),
        });
        if (!dashRes.ok) throw new Error(`dashboard ${dashRes.status}`);
        const dashboard = await dashRes.json();
        const enriched: Record<string, any>[] = dashboard.events ?? [];

        // 2️⃣  Raw events (to get location / attendees the pipeline doesn't keep)
        let rawMap: Record<string, Record<string, any>> = {};
        try {
          const rawRes = await fetch("/api/calendar/events", {
            signal: AbortSignal.timeout(3000),
          });
          if (rawRes.ok) {
            const rawList: Record<string, any>[] = await rawRes.json();
            rawMap = Object.fromEntries(rawList.map((e) => [e.id, e]));
          }
        } catch {
          // raw calendar is optional — predictions still work fine
        }

        if (cancelled) return;

        // 3️⃣  Merge into display shape
        const display = enriched.map((e) =>
          backendToDisplay(e, rawMap[e.id]),
        );
        setEvents(display);
        setBackendLive(true);
      } catch {
        // Backend unreachable → graceful fallback to mock data
        if (!cancelled) {
          setEvents(MOCK_EVENTS);
          setBackendLive(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Derived state ───────────────────────────────────────────────────── */

  const toggleCalendar = (cal: string) =>
    setActiveCalendars((prev) =>
      prev.includes(cal) ? prev.filter((c) => c !== cal) : [...prev, cal],
    );

  const filteredEvents = events.filter((e) => activeCalendars.includes(e.calendar));
  const totalPredicted = Math.round(
    filteredEvents.reduce((sum, e) => sum + e.predictedSpend, 0),
  );

  /* ── Loading state ───────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="text-sm text-slate-500">Loading calendar &amp; predictions…</span>
      </div>
    );
  }

  /* ── Main render ─────────────────────────────────────────────────────── */

  return (
    <div className="p-6 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <h2 className="text-slate-900">March 2–8, 2026</h2>
          <button className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Backend status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
              backendLive
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-orange-50 border-orange-200 text-orange-600"
            }`}
          >
            {backendLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {backendLive ? "Live predictions" : "Mock data"}
          </div>

          <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              Predicted: <strong>${totalPredicted}</strong>
            </span>
          </div>

          <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-slate-500">Calendars:</span>
        {CALENDAR_TYPES.map((cal) => {
          const colors = calendarColors[cal];
          if (!colors) return null;
          const isActive = activeCalendars.includes(cal);
          return (
            <button
              key={cal}
              onClick={() => toggleCalendar(cal)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-all ${
                isActive
                  ? `${colors.bg} ${colors.border} ${colors.text}`
                  : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full`}
                style={{ backgroundColor: isActive ? colors.dot : "#cbd5e1" }}
              />
              {cal}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4">
        {/* Calendar Grid */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {/* Day headers */}
          <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
            <div className="border-r border-slate-100" />
            {DAYS.map((day, i) => (
              <div
                key={day}
                className={`py-3 text-center border-r border-slate-100 last:border-r-0 ${
                  i === TODAY_INDEX ? "bg-blue-50" : ""
                }`}
              >
                <p className="text-xs text-slate-400">{day}</p>
                <p
                  className={`text-sm mt-0.5 ${
                    i === TODAY_INDEX
                      ? "w-7 h-7 bg-blue-600 text-white rounded-full mx-auto flex items-center justify-center"
                      : "text-slate-700"
                  }`}
                  style={{ fontWeight: i === TODAY_INDEX ? 600 : 400 }}
                >
                  {DATES[i]}
                </p>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="overflow-y-auto" style={{ maxHeight: "480px" }}>
            <div className="relative" style={{ height: `${HOURS.length * 56}px` }}>
              {/* Hour lines */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-slate-100 flex"
                  style={{ top: `${(hour - 7) * 56}px` }}
                >
                  <div className="w-[52px] flex-shrink-0 flex items-start justify-end pr-2 pt-1">
                    <span className="text-xs text-slate-400">
                      {hour > 12 ? `${hour - 12}pm` : hour === 12 ? "12pm" : `${hour}am`}
                    </span>
                  </div>
                  <div className="flex-1 border-l border-slate-100" />
                </div>
              ))}

              {/* Column dividers */}
              <div
                className="absolute top-0 bottom-0"
                style={{ left: "52px", right: 0, display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
              >
                {DAYS.map((day, i) => (
                  <div key={day} className={`border-r border-slate-100 ${i === TODAY_INDEX ? "bg-blue-50/30" : ""}`} />
                ))}
              </div>

              {/* Events */}
              {filteredEvents.map((event) => {
                const dayIdx = getDayIndex(event.date);
                if (dayIdx < 0) return null;
                const { top, height } = getEventStyle(event);
                const colors = calendarColors[event.calendar] ?? calendarColors.Personal;
                const leftOffset = `calc(52px + ${dayIdx} * (100% - 52px) / 7 + 2px)`;

                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`absolute rounded-lg px-2 py-1 border text-left overflow-hidden transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer ${colors.bg} ${colors.border}`}
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      left: leftOffset,
                      width: `calc((100% - 52px) / 7 - 4px)`,
                    }}
                  >
                    <p className={`text-xs truncate ${colors.text}`} style={{ fontWeight: 600, lineHeight: "1.3" }}>
                      {event.title}
                    </p>
                    {height > 36 && (
                      <p className="text-xs text-slate-500" style={{ lineHeight: "1.3" }}>{event.time}</p>
                    )}
                    {height > 52 && event.predictedSpend > 0 && (
                      <p className={`text-xs ${colors.text} mt-0.5`} style={{ lineHeight: "1.3" }}>
                        ~${Math.round(event.predictedSpend)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* Event detail */}
          {selectedEvent ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div
                    className={`inline-block px-2 py-0.5 rounded-full text-xs mb-2 ${
                      (calendarColors[selectedEvent.calendar] ?? calendarColors.Personal).bg
                    } ${
                      (calendarColors[selectedEvent.calendar] ?? calendarColors.Personal).text
                    }`}
                  >
                    {selectedEvent.calendar}
                  </div>
                  <h3 className="text-slate-800">{selectedEvent.title}</h3>
                </div>
                <button
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
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{selectedEvent.attendees} attendees</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-800" style={{ fontWeight: 500 }}>
                    Predicted: ${Math.round(selectedEvent.predictedSpend)}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-slate-500 capitalize">{selectedEvent.category}</span>
                </div>
                {selectedEvent.why && (
                  <div className="flex items-start gap-1.5 mt-2">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-400 italic">{selectedEvent.why}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-slate-800 mb-3">Select an event</h3>
              <p className="text-sm text-slate-400">
                Click any event on the calendar to see details and spending prediction.
              </p>
            </div>
          )}

          {/* Week Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-slate-800 mb-3">Week Summary</h3>
            <div className="space-y-2">
              {CALENDAR_TYPES.map((cal) => {
                const calEvents = filteredEvents.filter((e) => e.calendar === cal);
                const spend = Math.round(calEvents.reduce((s, e) => s + e.predictedSpend, 0));
                const colors = calendarColors[cal];
                if (!colors) return null;
                return (
                  <div key={cal} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: colors.dot }}
                      />
                      <span className="text-xs text-slate-600">{cal}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-700" style={{ fontWeight: 500 }}>
                        {calEvents.length} events · ${spend}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-slate-100 pt-2 mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500" style={{ fontWeight: 600 }}>Total</span>
                <span className="text-sm text-slate-900" style={{ fontWeight: 600 }}>${totalPredicted}</span>
              </div>
            </div>
          </div>

          {/* Calendar Connections */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white">
            <h3 className="text-white mb-1">{CALENDAR_TYPES.length} Calendars</h3>
            <p className="text-xs text-blue-200 mb-3">All synced via Google Calendar</p>
            <div className="flex gap-1">
              {CALENDAR_TYPES.map((cal) => (
                <div
                  key={cal}
                  className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs"
                >
                  {cal[0]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

