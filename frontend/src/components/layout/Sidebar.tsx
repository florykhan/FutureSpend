"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  CalendarBlank,
  Trophy,
  ChatCircle,
  GearSix,
  House,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home", icon: House },
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/calendar", label: "Calendar", icon: CalendarBlank },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/coach", label: "AI Coach", icon: ChatCircle },
  { href: "/settings", label: "Settings", icon: GearSix },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 flex-shrink-0 border-r border-slate-200/80 bg-app-sidebar md:block">
      <nav className="flex flex-col gap-0.5 p-2 pt-4">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors",
                isActive
                  ? "bg-primary-100 text-primary-800"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon size={20} weight="bold" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
