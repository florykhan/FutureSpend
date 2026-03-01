"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
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
          <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className={cn("text-sm", isHome ? "text-primary-400" : "text-slate-900")} style={{ lineHeight: "1.2" }}>
              {APP_NAME}
            </p>
            <p className={cn("text-xs", isHome ? "text-slate-400" : "text-slate-500")} style={{ lineHeight: "1.2" }}>
              Finance
            </p>
          </div>
        </Link>
        <nav className="flex min-w-0 flex-1 justify-end">
          <Link
            href="/dashboard"
            className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-primary-600 text-white hover:bg-primary-700"
          >
            Getting Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
