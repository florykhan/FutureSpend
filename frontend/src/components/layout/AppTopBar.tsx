"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/calendar": "Calendar",
  "/predictions": "Predictions",
  "/challenges": "Challenges",
  "/leaderboard": "Leaderboard",
  "/banking": "Banking",
  "/coach": "AI Coach",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || (path !== "/dashboard" && pathname.startsWith(path)))
      return title;
  }
  return "Dashboard";
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function AppTopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-slate-900 text-lg font-semibold" style={{ margin: 0 }}>
          {title}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5" style={{ lineHeight: "1.4" }}>
          {getFormattedDate()}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/challenges"
          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors"
        >
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Active Challenge
        </Link>
        <button
          type="button"
          className="relative w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>
        <Link
          href="/settings"
          className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4 text-slate-600" />
        </Link>
      </div>
    </header>
  );
}
