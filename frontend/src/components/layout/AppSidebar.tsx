"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  CalendarBlank,
  Trophy,
  ChatCircle,
  GearSix,
  CaretLeft,
  CaretRight,
  House,
  TrendUp,
  Bank,
  Medal,
} from "@phosphor-icons/react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: House, label: "Home" },
  { href: "/dashboard", icon: SquaresFour, label: "Dashboard" },
  { href: "/calendar", icon: CalendarBlank, label: "Calendar" },
  { href: "/predictions", icon: TrendUp, label: "Predictions" },
  { href: "/challenges", icon: Trophy, label: "Challenges" },
  { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
  { href: "/banking", icon: Bank, label: "Banking" },
  { href: "/coach", icon: ChatCircle, label: "AI Coach" },
  { href: "/settings", icon: GearSix, label: "Settings" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-surface-0 border-r border-white/[0.06] transition-all duration-300 flex-shrink-0",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-white/[0.08] flex items-center justify-center">
          <span className="text-sm font-semibold text-white">F</span>
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-zinc-100 tracking-tight">
            {APP_NAME}
          </span>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href || (href !== "/" && href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors duration-150",
                isActive
                  ? "bg-white/[0.08] text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} weight="bold" className="flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-3 top-16 w-6 h-6 bg-surface-2 border border-white/[0.08] rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors z-10 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-0"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <CaretRight size={14} weight="bold" aria-hidden="true" />
        ) : (
          <CaretLeft size={14} weight="bold" aria-hidden="true" />
        )}
      </button>
    </aside>
  );
}
