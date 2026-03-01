"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, GearSix, Sparkle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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

interface AppTopBarProps {
  aiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
}

export function AppTopBar({ aiSidebarOpen, onToggleAiSidebar }: AppTopBarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="flex flex-shrink-0 flex-col gap-4 border-b border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-white">Workspace</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-white sm:text-[2.4rem]" style={{ margin: 0 }}>
          {title}
        </h1>
        <p className="mt-1.5 text-base font-semibold text-white" style={{ lineHeight: "1.4" }} suppressHydrationWarning>
          {dateLabel}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href="/challenges"
          className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.05] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/[0.1]"
        >
          <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-300" />
          </span>
          Active Challenge
        </Link>
        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] transition-colors hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-zinc-400"
          aria-label="View notifications"
        >
          <Bell size={18} weight="bold" className="text-white" aria-hidden="true" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
        </button>
        <Link
          href="/settings"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] transition-colors hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-zinc-400"
          aria-label="Settings"
        >
          <GearSix size={18} weight="bold" className="text-white" aria-hidden="true" />
        </Link>
        {onToggleAiSidebar && (
          <button
            type="button"
            onClick={onToggleAiSidebar}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl border transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400",
              aiSidebarOpen
                ? "border-white/[0.18] bg-accent-purple/30 text-white"
                : "border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.1]"
            )}
            aria-label={aiSidebarOpen ? "Close AI assistant" : "Open AI assistant"}
          >
            <Sparkle size={18} weight={aiSidebarOpen ? "fill" : "bold"} aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
