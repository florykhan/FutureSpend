"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Lightning,
  TrendUp,
  Trophy,
  HeartStraight,
  CreditCard,
  CalendarBlank,
  ArrowUp,
  Sparkle,
} from "@phosphor-icons/react";
import { PageShell } from "@/components/layout/PageShell";
import { api } from "@/lib/api";
import { getStoredMonthlyBudget } from "@/lib/preferences";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  /** Action chips returned from the backend (e.g. "Lock $50", "Create challenge") */
  actions?: Array<{ id: string; label: string; impact: string; type: string }>;
}

interface CoachCalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  calendarType?: string;
  location?: string;
  attendees?: number;
  predictedSpend?: number;
  category?: string;
  why?: string;
}

/* ─── Suggested prompts ─── */

const PROMPTS = [
  {
    icon: TrendUp,
    label: "Weekend spending",
    description: "What will I spend this weekend?",
    query: "What will I spend this weekend?",
  },
  {
    icon: Trophy,
    label: "Create challenge",
    description: "Set a savings challenge for me",
    query: "Create a savings challenge for me",
  },
  {
    icon: HeartStraight,
    label: "Financial health",
    description: "Check my current health score",
    query: "How's my financial health?",
  },
  {
    icon: CreditCard,
    label: "My balance",
    description: "Show my current account balance",
    query: "What's my balance?",
  },
  {
    icon: CalendarBlank,
    label: "Calendar events",
    description: "Events that affect my spend",
    query: "What's on my calendar this week?",
  },
  {
    icon: Sparkle,
    label: "Top insight",
    description: "Give me your best tip today",
    query: "What's your top spending insight for me today?",
  },
];

/* ─────────────────────────────────────
 * BACKEND CONTRACT
 *
 * POST /api/coach/chat
 * Body:  { message: string, session_id: string, events: unknown[], monthly_budget: number }
 * Reply: { reply: { id, role, content, timestamp }, actions: ActionChip[] }
 *
 * To swap in real streaming (SSE / ReadableStream):
 *   1. Change `api.coachChat(...)` below to a fetch() with ReadableStream
 *   2. Push each chunk into the `streamRef` and update `streamId` once done
 *   3. Remove the character-animation loop — pipe chunks directly into msg.content
 * ───────────────────────────────────── */

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CoachCalendarEvent[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(getStoredMonthlyBudget);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Holds the pending stream state to avoid closure staleness
  const streamRef = useRef<{ id: string; text: string; index: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Auto-scroll on new messages / loading state ─── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  /* ─── Character-by-character stream animation ─── */
  useEffect(() => {
    if (!streamId) return;
    const s = streamRef.current;
    if (!s) return;

    timerRef.current = setInterval(() => {
      s.index = Math.min(s.index + 4, s.text.length); // 4 chars / 12ms ≈ ~330 chars/sec
      const slice = s.text.slice(0, s.index);
      setMessages((prev) => prev.map((m) => (m.id === s.id ? { ...m, content: slice } : m)));

      if (s.index >= s.text.length) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setStreamId(null);
        streamRef.current = null;
      }
    }, 12);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [streamId]);

  useEffect(() => {
    let cancelled = false;

    api
      .getDashboard()
      .then((data) => {
        if (cancelled) return;
        setCalendarEvents(data.events ?? []);
        setMonthlyBudget(data.forecast?.monthlyBudget ?? getStoredMonthlyBudget());
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  /* ─── Auto-resize textarea (up to 5 lines) ─── */
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, []);

  /* ─── Send message ─── */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading || streamRef.current) return;

      // Optimistically add user message
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      // Helper: add placeholder assistant message and kick off stream animation
      const aId = `a-${Date.now()}`;
      const startStream = (content: string, actions?: Message["actions"]) => {
        setMessages((prev) => [
          ...prev,
          { id: aId, role: "assistant", content: "", timestamp: new Date().toISOString(), actions },
        ]);
        setIsLoading(false);
        streamRef.current = { id: aId, text: content, index: 0 };
        setStreamId(aId); // triggers the animation useEffect
      };

      if (process.env.NEXT_PUBLIC_API_URL) {
        try {
          const res = await api.coachChat(trimmed, "default", calendarEvents, monthlyBudget);
          startStream(res.reply.content, res.actions);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Coach is unavailable right now.";
          startStream(message);
        }
      } else {
        startStream("Coach is unavailable until NEXT_PUBLIC_API_URL is configured.");
      }
    },
    [calendarEvents, isLoading, monthlyBudget]
  );

  /* ─── Keyboard: Enter sends, Shift+Enter is newline ─── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <PageShell>
      <div className="relative flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(46,144,250,0.18),_transparent_34%),radial-gradient(circle_at_85%_12%,_rgba(135,91,247,0.14),_transparent_28%),linear-gradient(180deg,_rgba(16,18,24,0.98)_0%,_rgba(9,9,11,1)_38%,_rgba(6,6,8,1)_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)] opacity-60" />
        <div className="pointer-events-none absolute inset-y-24 right-[-12%] h-72 w-72 rounded-full bg-accent-blue/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8%] left-[-10%] h-80 w-80 rounded-full bg-accent-purple/10 blur-3xl" />
        {/* ─── Header ─── */}
        <div className="relative z-10 flex flex-shrink-0 items-center gap-4 border-b border-white/[0.1] bg-black/10 px-6 py-5 backdrop-blur-sm lg:px-8">
          <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-accent-blue/30 via-sky-300/15 to-accent-purple/25 shadow-[0_18px_40px_-24px_rgba(46,144,250,0.95)]">
            <Lightning size={24} weight="fill" className="text-white" />
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-[#0b0b0f] bg-success" />
          </div>
          <div className="min-w-0">
            <p className="text-[1.75rem] font-black leading-none tracking-[-0.04em] text-white sm:text-[2rem]">
              FutureSpend Coach
            </p>
            <p className="mt-1 text-sm font-bold uppercase tracking-[0.22em] text-white">
              Powered by multi-calendar intelligence
            </p>
          </div>
        </div>

        {/* ─── Messages viewport ─── */}
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8 lg:px-8">

            {/* Welcome screen (shown when no messages) */}
            {isEmpty && (
              <div className="flex animate-fade-up flex-col items-center gap-10 py-12 text-center">
                <div className="text-center">
                  <h1 className="text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
                    Good to see you.
                  </h1>
                  <p className="mt-3 text-lg font-semibold leading-8 text-white sm:text-xl">
                    Ask anything about your spending or pick a prompt below.
                  </p>
                </div>

                {/* Prompt grid — 2 columns */}
                <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => sendMessage(p.query)}
                      className="group flex min-h-[120px] items-start gap-4 rounded-[1.35rem] border border-white/[0.14] bg-white/[0.045] px-5 py-5 text-left shadow-[0_28px_60px_-38px_rgba(46,144,250,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.26] hover:bg-white/[0.08]"
                    >
                      <p.icon
                        size={20}
                        weight="duotone"
                        className="mt-0.5 flex-shrink-0 text-white transition-transform duration-200 group-hover:scale-110"
                      />
                      <div className="space-y-1">
                        <p className="text-base font-bold tracking-[-0.02em] text-white">
                          {p.label}
                        </p>
                        <p className="text-sm font-semibold leading-6 text-white">
                          {p.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3.5 animate-fade-up",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Assistant avatar */}
                {msg.role === "assistant" && (
                  <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] shadow-[0_16px_34px_-26px_rgba(46,144,250,1)]">
                    <Lightning size={15} weight="fill" className="text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col gap-2",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {/* Bubble */}
                  <div
                    className={cn(
                      "text-base font-semibold leading-8 text-white sm:text-lg",
                      msg.role === "user"
                        ? "max-w-xl rounded-[1.6rem] rounded-tr-md border border-white/[0.12] bg-white/[0.08] px-5 py-4 shadow-[0_30px_60px_-42px_rgba(255,255,255,0.65)]"
                        : "max-w-3xl rounded-[1.6rem] rounded-tl-md border border-white/[0.08] bg-black/10 px-5 py-4 shadow-[0_30px_60px_-44px_rgba(46,144,250,0.6)]"
                    )}
                  >
                    {msg.content}
                    {/* Streaming cursor */}
                    {msg.id === streamId && (
                      <span className="ml-0.5 inline-block h-[1.2em] w-[3px] animate-pulse bg-white align-middle" />
                    )}
                  </div>

                  {/* Action chips (shown after stream finishes) */}
                  {msg.actions && msg.actions.length > 0 && msg.id !== streamId && (
                    <div className="flex flex-wrap gap-2">
                      {msg.actions.map((action) => (
                        <span
                          key={action.id}
                          className="inline-flex items-center rounded-full border border-white/[0.14] bg-white/[0.08] px-3.5 py-1.5 text-sm font-bold text-white"
                        >
                          {action.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-3.5 animate-fade-up">
                <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06]">
                  <Lightning size={15} weight="fill" className="text-white" />
                </div>
                <div className="flex items-center gap-2 py-4">
                  <span
                    className="h-2 w-2 rounded-full bg-white animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-white animate-bounce"
                    style={{ animationDelay: "160ms" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-white animate-bounce"
                    style={{ animationDelay: "320ms" }}
                  />
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ─── Composer ─── */}
        <div className="relative z-10 flex-shrink-0 border-t border-white/[0.1] bg-black/10 px-5 py-5 backdrop-blur-sm lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex min-h-[92px] items-end gap-4 rounded-[1.75rem] border border-white/[0.14] bg-white/[0.045] px-5 py-4 shadow-[0_32px_80px_-52px_rgba(46,144,250,0.95)] transition-colors focus-within:border-white/[0.28]">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  resizeTextarea();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about spending, challenges, calendar..."
                disabled={isLoading}
                rows={2}
                style={{ maxHeight: 180 }}
                className="flex-1 resize-none bg-transparent text-lg font-semibold leading-8 text-white outline-none placeholder:text-white/55 disabled:opacity-50 sm:text-xl"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading || !!streamId}
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-accent-blue shadow-[0_24px_50px_-28px_rgba(46,144,250,1)] transition-all hover:scale-[1.03] hover:bg-[#4ba2fb] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Send message"
              >
                <ArrowUp size={20} weight="bold" className="text-white" />
              </button>
            </div>
            <p className="mt-3 text-center text-sm font-semibold text-white">
              <kbd className="rounded-lg border border-white/[0.14] bg-white/[0.06] px-2 py-1 font-mono text-white">Enter</kbd>{" "}
              to send ·{" "}
              <kbd className="rounded-lg border border-white/[0.14] bg-white/[0.06] px-2 py-1 font-mono text-white">⇧ Enter</kbd>{" "}
              for newline
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
