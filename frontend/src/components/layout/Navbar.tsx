"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lightning } from "@phosphor-icons/react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:backdrop-blur-md",
        isHome
          ? "border-white/10 bg-black/15 bg-slate-900/25"
          : "border-slate-200 bg-white/85 supports-[backdrop-filter]:bg-white/70"
      )}
    >
      <div className="flex h-14 w-full min-w-0 items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 font-semibold"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-accent-blue shadow-[0_2px_12px_rgba(46,144,250,0.4)]">
            <Lightning size={18} weight="fill" className="text-white" />
          </div>
          <div>
            <p
              className={cn("text-sm font-semibold", isHome ? "text-white" : "text-slate-900")}
              style={{ lineHeight: "1.2" }}
            >
              {APP_NAME}
            </p>
            <p
              className={cn("text-xs", isHome ? "text-white/70" : "text-slate-500")}
              style={{ lineHeight: "1.2" }}
            >
              Finance
            </p>
          </div>
        </Link>
        <nav className="flex min-w-0 flex-1 justify-end">
          <Link
            href="/dashboard"
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
              isHome
                ? "border border-white/20 bg-white/10 text-white shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm hover:scale-[1.02] hover:border-white/30 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus:ring-white/40 focus:ring-offset-slate-900"
                : "bg-slate-800 text-white shadow-sm hover:bg-slate-700 focus:ring-accent-blue focus:ring-offset-white"
            )}
          >
            Getting Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
