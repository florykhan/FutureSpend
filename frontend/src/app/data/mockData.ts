/**
 * CalendarEventDisplay — the shape every calendar‑grid component needs.
 * The backend returns ISO start/end + calendarType; we normalise here.
 */
export interface CalendarEventDisplay {
  id: string;
  title: string;
  date: string;          // "2026-03-03"
  time: string;          // "12:00"
  duration: number;      // minutes
  calendar: string;      // "Work" | "Personal" | "Social" | "Health"
  predictedSpend: number;
  category: string;
  location?: string;
  attendees: number;
  why?: string;
}

/** Hardcoded fallback — used only if the backend is unreachable. */
export const weeklyCalendarEvents: CalendarEventDisplay[] = [
  {
    id: "evt-1", title: "Team lunch - Downtown", date: "2026-03-03", time: "12:00",
    duration: 90, calendar: "Work", predictedSpend: 55, category: "food",
    location: "Earls Restaurant", attendees: 4, why: "lunch, downtown → restaurant meal with group",
  },
  {
    id: "evt-2", title: "Coffee with Sarah", date: "2026-03-03", time: "15:00",
    duration: 60, calendar: "Social", predictedSpend: 10, category: "food",
    location: "Starbucks", attendees: 2, why: "coffee → café",
  },
  {
    id: "evt-3", title: "Dentist appointment", date: "2026-03-04", time: "09:00",
    duration: 60, calendar: "Health", predictedSpend: 0, category: "other",
    attendees: 1, why: "Pre-paid / insurance",
  },
  {
    id: "evt-4", title: "Birthday dinner - Alex", date: "2026-03-05", time: "19:00",
    duration: 180, calendar: "Social", predictedSpend: 85, category: "food",
    location: "The Keg Steakhouse", attendees: 6, why: "dinner, birthday → restaurant + gift",
  },
  {
    id: "evt-5", title: "Uber to office (client meeting)", date: "2026-03-06", time: "08:30",
    duration: 30, calendar: "Work", predictedSpend: 20, category: "transport",
    attendees: 1, why: "Uber, office → ride share",
  },
  {
    id: "evt-6", title: "Weekend brunch with friends", date: "2026-03-08", time: "11:00",
    duration: 120, calendar: "Social", predictedSpend: 45, category: "food",
    location: "OEB Breakfast Co.", attendees: 3, why: "brunch, friends → restaurant",
  },
  {
    id: "evt-7", title: "Movie night — Dune 3", date: "2026-03-08", time: "19:00",
    duration: 180, calendar: "Personal", predictedSpend: 100, category: "entertainment",
    location: "Cineplex", attendees: 2, why: "movie → entertainment venue",
  },
  {
    id: "evt-8", title: "Tim Hortons run", date: "2026-03-04", time: "07:30",
    duration: 30, calendar: "Personal", predictedSpend: 5, category: "food",
    location: "Tim Hortons", attendees: 1, why: "Tim Hortons → café / coffee",
  },
  {
    id: "evt-9", title: "Starbucks before class", date: "2026-03-05", time: "08:00",
    duration: 30, calendar: "Personal", predictedSpend: 7, category: "food",
    location: "Starbucks", attendees: 1, why: "Starbucks → café / coffee",
  },
  {
    id: "evt-10", title: "Uber to downtown hangout", date: "2026-03-07", time: "18:00",
    duration: 30, calendar: "Social", predictedSpend: 20, category: "transport",
    attendees: 1, why: "Uber → ride share",
  },
];

export const currentUser = {
  connectedCalendars: ["Work", "Personal", "Social", "Health"],
};
