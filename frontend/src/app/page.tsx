import Link from "next/link";
import { CalendarBlank, UploadSimple, ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { PageShell } from "@/components/layout/PageShell";
import { ScrollArrow } from "@/components/landing/ScrollArrow";
import { HeroLockup } from "@/components/landing/HeroLockup";
import { APP_NAME, TAGLINE } from "@/lib/constants";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const STEPS = [
  {
    title: "Connect your calendars",
    body: "Link work, personal, and social calendars so we can predict spending triggers.",
  },
  {
    title: "Upload or link transactions",
    body: "Optional CSV upload or connect your bank for accurate insights.",
  },
  {
    title: "See your forecast & join challenges",
    body: "Get a 7-day spending forecast, insights, and savings challenges with friends.",
  },
];

export default function HomePage() {
  return (
    <PageShell withSidebar={false}>
      <div className="relative min-h-screen w-full min-w-full overflow-x-hidden bg-slate-950">
        {/* Fixed background */}
        <div
          className="fixed z-0 bg-slate-950"
          style={{
            left: 0,
            top: 0,
            width: "100vw",
            minWidth: "100vw",
            height: "100dvh",
            minHeight: "100vh",
          }}
          aria-hidden
        >
          {/* Fallback gradient when video is missing or fails (e.g. on GitHub Pages) */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(15, 23, 42, 0.9), transparent 50%), radial-gradient(ellipse 80% 70% at 50% 50%, rgba(16, 185, 129, 0.08), transparent 65%)",
            }}
            aria-hidden
          />
          {/* Base path required for GitHub Pages (site is at /FutureSpend/) */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              minWidth: "100%",
              minHeight: "100%",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          >
            <source src={`${BASE_PATH}/background.mov`} type="video/quicktime" />
          </video>
          <div className="absolute inset-0 bg-slate-900/55" />
          <div
            className="absolute inset-0 mix-blend-overlay opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(52, 211, 153, 0.3), transparent 65%), linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, transparent 45%)",
            }}
          />
        </div>

        <div className="relative z-10">
          {/* Hero */}
          <section className="relative flex min-h-[calc(100vh-3.5rem)] w-full items-center justify-center px-5 py-24 text-center sm:px-8">
            <ScrollArrow targetId="steps" />
            <div className="flex max-w-3xl flex-col items-center">
              {/* Logo-style lockup: animation plays once per session, then final state */}
              <HeroLockup>
                <div className="hero-box-bg" aria-hidden />
                <svg
                  className="hero-box-svg"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    className="hero-box-path"
                    d="M 12,0 L 88,0 A 12,12 0 0 1 100,12 L 100,88 A 12,12 0 0 1 88,100 L 12,100 A 12,12 0 0 1 0,88 L 0,12 A 12,12 0 0 1 12,0 Z"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="0.8"
                  />
                </svg>
                <h1 className="relative z-10 flex flex-col items-center gap-2 text-center sm:gap-3">
                  <span
                    className="gradient-text-animate block font-extrabold leading-[1.05] tracking-[-0.03em] [filter:drop-shadow(0_2px_20px_rgba(0,0,0,0.5))_drop-shadow(0_0_1px_rgba(255,255,255,0.2))]"
                    style={{ fontSize: "clamp(2.5rem, 10vw + 1.5rem, 5rem)" }}
                  >
                    {APP_NAME}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-[0.2em] text-white/70 sm:text-base sm:tracking-[0.3em]">
                    {TAGLINE}
                  </span>
                </h1>
              </HeroLockup>
              <p className="mt-10 max-w-xl text-lg leading-[1.7] text-slate-200/95 sm:mt-12 sm:text-xl [text-shadow:0_1px_12px_rgba(0,0,0,0.3)]">
                Turn your calendar into a spending forecast. Get insights, stay on budget, and win
                challenges with friends.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="group inline-flex h-12 min-w-[180px] items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-6 text-base font-semibold text-white shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-white/30 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  <CalendarBlank size={22} weight="bold" className="transition-transform duration-200 group-hover:scale-105" />
                  Connect Calendar (mock)
                </Link>
                <Link
                  href="/dashboard"
                  className="group inline-flex h-12 min-w-[180px] items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-6 text-base font-semibold text-white shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-white/30 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  <UploadSimple size={22} weight="bold" className="transition-transform duration-200 group-hover:scale-105" />
                  Upload Transactions CSV (mock)
                </Link>
              </div>
            </div>
          </section>

          {/* Steps — premium glass panel */}
          <section id="steps" className="scroll-mt-20 px-4 py-14 sm:px-6 sm:py-16">
            <div className="mx-auto max-w-3xl">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                How it works
              </p>
              <h2 className="mt-3 text-center text-xl font-bold tracking-tight text-white sm:text-2xl md:tracking-[-0.02em]">
                Get started in 3 steps
              </h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-slate-400">
                Set up once and see your spending forecast.
              </p>
              <div className="mt-8 grid gap-3 sm:gap-4">
                {STEPS.map((step, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-4 rounded-xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.08] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] sm:p-6"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-base font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h3 className="text-sm font-semibold text-white sm:text-base">{step.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:text-sm">{step.body}</p>
                    </div>
                    <CheckCircle size={22} weight="fill" className="flex-shrink-0 text-primary-400/90" />
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Link
                  href="/dashboard"
                  className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-8 text-base font-semibold text-white shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-white/30 hover:bg-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  Go to Dashboard
                  <ArrowRight size={22} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
