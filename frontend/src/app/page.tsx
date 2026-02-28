import Link from "next/link";
import { Calendar, Upload, ArrowRight, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { TAGLINE } from "@/lib/constants";

const STEPS = [
  { title: "Connect your calendars", body: "Link work, personal, and social calendars so we can predict spending triggers." },
  { title: "Upload or link transactions", body: "Optional CSV upload or connect your bank for accurate insights." },
  { title: "See your forecast & join challenges", body: "Get a 7-day spending forecast, insights, and savings challenges with friends." },
];

export default function HomePage() {
  return (
    <PageShell withSidebar={false}>
      <div className="min-h-[calc(100vh-3.5rem)]">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50/50 px-4 py-16 sm:py-24">
          <div className="container mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              {TAGLINE}
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Turn your calendar into a spending forecast. Get insights, stay on budget, and win challenges with friends.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  <Calendar className="h-5 w-5" />
                  Connect Calendar (mock)
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Transactions CSV (mock)
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Demo mode — data is mocked. Connect real sources in production.
            </p>
          </div>
        </section>

        {/* Onboarding steps */}
        <section className="border-b border-slate-200 bg-white px-4 py-12">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-center text-xl font-semibold text-slate-900">
              Get started in 3 steps
            </h2>
            <div className="mt-8 space-y-6">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50/30 p-4"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{step.body}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/dashboard">
                <Button className="gap-2">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
