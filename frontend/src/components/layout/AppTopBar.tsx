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

export function AppTopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="bg-surface-0 border-b border-white/[0.06] px-6 py-3.5 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-zinc-100 text-[15px] font-medium tracking-tight" style={{ margin: 0 }}>
          {title}
        </h1>
        <p className="text-[11px] text-zinc-600 mt-0.5 font-mono" style={{ lineHeight: "1.4" }} suppressHydrationWarning>
          {new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(new Date())}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/challenges"
          className="flex items-center gap-1.5 bg-green-500/[0.12] text-green-400 px-3 py-1.5 rounded-full text-[11px] font-medium hover:bg-green-500/20 transition-colors"
        >
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
          </span>
          Active Challenge
        </Link>
        <button
          type="button"
          className="relative w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400"
          aria-label="View notifications"
        >
          <Bell className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" aria-hidden="true" />
        </button>
        <Link
          href="/settings"
          className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400"
          aria-label="Settings"
        >
          <Settings className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
