import Link from "next/link";
import { Calendar, Upload, ArrowRight, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ScrollArrow } from "@/components/landing/ScrollArrow";
import { TAGLINE } from "@/lib/constants";

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
            <source src="/background.mov" type="video/quicktime" />
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
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl md:leading-[1.15] md:tracking-[-0.02em]">
                <span className="gradient-text-animate inline-block [filter:drop-shadow(0_2px_24px_rgba(0,0,0,0.4))_drop-shadow(0_0_1px_rgba(255,255,255,0.15))]">
                  {TAGLINE}
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-[1.7] text-slate-200/95 sm:text-xl [text-shadow:0_1px_12px_rgba(0,0,0,0.3)]">
                Turn your calendar into a spending forecast. Get insights, stay on budget, and win
                challenges with friends.
              </p>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="group inline-flex h-12 min-w-[180px] items-center justify-center gap-2.5 rounded-xl bg-primary-200 px-6 text-base font-semibold text-primary-900 shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.02] hover:bg-primary-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  <Calendar className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
                  Connect Calendar (mock)
                </Link>
                <Link
                  href="/dashboard"
                  className="group inline-flex h-12 min-w-[180px] items-center justify-center gap-2.5 rounded-xl border border-white/25 bg-white/[0.07] px-6 text-base font-semibold text-white backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:border-white/40 hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  <Upload className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
                  Upload Transactions CSV (mock)
                </Link>
              </div>
              <p className="mt-8 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium tracking-wide text-slate-400 backdrop-blur-sm">
                Demo mode — data is mocked. Connect real sources in production.
              </p>
            </div>
          </section>

          {/* Steps — premium glass panel */}
          <section id="steps" className="scroll-mt-20 px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                How it works
              </p>
              <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl md:tracking-[-0.02em]">
                Get started in 3 steps
              </h2>
              <p className="mt-3 text-center text-sm leading-relaxed text-slate-400">
                Set up once and see your spending forecast.
              </p>
              <div className="mt-12 grid gap-4 sm:gap-5">
                {STEPS.map((step, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.08] hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] sm:p-7"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/25 to-primary-600/15 text-lg font-bold text-primary-200 shadow-inner">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h3 className="font-semibold text-white">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-primary-400/90" />
                  </div>
                ))}
              </div>
              <div className="mt-12 flex justify-center">
                <Link
                  href="/dashboard"
                  className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-primary-200 px-8 text-base font-semibold text-primary-900 shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.02] hover:bg-primary-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
