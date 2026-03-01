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
import { FormattedAssistantMessage } from "@/components/ai/FormattedAssistantMessage";
import { api } from "@/lib/api";
import { getStoredMonthlyBudget } from "@/lib/preferences";
import { createChatSessionId } from "@/lib/session";
import type { CalendarEvent } from "@/lib/types";
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

type CoachAction = NonNullable<Message["actions"]>[number];
type ActionStatus = "idle" | "loading" | "done" | "error";

function parseActionAmount(action: CoachAction): number | null {
  const source = `${action.label} ${action.impact}`;
  const match = source.match(/\$(-?\d+(?:\.\d{1,2})?)/);
  if (!match) return null;

  const amount = Number.parseFloat(match[1]);
  if (Number.isNaN(amount)) return null;
  return Math.max(0, amount);
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
  const [actionStatus, setActionStatus] = useState<Record<string, ActionStatus>>({});
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(getStoredMonthlyBudget);
  const [sessionId] = useState(() => createChatSessionId("coach"));

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Holds the pending stream state to avoid closure staleness
  const streamRef = useRef<{ id: string; text: string; index: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Auto-scroll on new messages / loading state ─── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
    const storedBudget = getStoredMonthlyBudget();

    api
      .getDashboard({ monthlyBudget: storedBudget, sessionId })
      .then((data) => {
        if (cancelled) return;
        setCalendarEvents(data.events ?? []);
        setMonthlyBudget(data.forecast?.monthlyBudget ?? storedBudget);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

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

      try {
        const res = await api.coachChat(trimmed, sessionId, calendarEvents, monthlyBudget);
        startStream(res.reply.content, res.actions);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Coach is unavailable right now.";
        startStream(message);
      }
    },
    [calendarEvents, isLoading, monthlyBudget, sessionId]
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

  const applyAction = useCallback(
    async (action: CoachAction) => {
      if (actionStatus[action.id] === "loading" || actionStatus[action.id] === "done") return;
      if (isLoading || streamRef.current) return;

      setActionStatus((prev) => ({ ...prev, [action.id]: "loading" }));

      try {
        if (action.type === "cap" || /lock\s*\$/i.test(action.label)) {
          const amount = parseActionAmount(action);
          if (amount === null) {
            throw new Error("Could not detect a dollar amount for this vault action.");
          }

          const result = await api.bankLock(amount, "default", `coach-action:${action.id}`);
          if (!result.ok) {
            throw new Error(result.error ?? "Vault lock failed.");
          }

          const amt = amount.toFixed(2);
          setActionStatus((prev) => ({ ...prev, [action.id]: "done" }));
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              content: `Done - locked $${amt} in your default savings vault.`,
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }

        setActionStatus((prev) => ({ ...prev, [action.id]: "done" }));
        await sendMessage(`Apply this action: ${action.label}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Something went wrong while applying this action.";
        setActionStatus((prev) => ({ ...prev, [action.id]: "error" }));
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: `I could not apply "${action.label}" yet: ${message}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    },
    [actionStatus, isLoading, sendMessage]
  );

  return (
    <PageShell>
      <div className="relative flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(46,144,250,0.18),_transparent_34%),radial-gradient(circle_at_85%_12%,_rgba(135,91,247,0.14),_transparent_28%),linear-gradient(180deg,_rgba(16,18,24,0.98)_0%,_rgba(9,9,11,1)_38%,_rgba(6,6,8,1)_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)] opacity-60" />
        <div className="pointer-events-none absolute inset-y-24 right-[-12%] h-72 w-72 rounded-full bg-accent-blue/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-8%] left-[-10%] h-80 w-80 rounded-full bg-accent-purple/10 blur-3xl" />
        {/* ─── Messages viewport ─── */}
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 pb-6 pt-24 sm:gap-6 sm:px-5 sm:pb-8 sm:pt-28 lg:px-8">

            {/* Welcome screen (shown when no messages) */}
            {isEmpty && (
              <div className="flex animate-fade-up flex-col items-center gap-7 py-8 text-center sm:gap-10 sm:py-12">
                <div className="text-center">
                  <h1 className="text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
                    Good to see you.
                  </h1>
                  <p className="mt-2 text-base font-semibold leading-7 text-white sm:mt-3 sm:text-lg sm:leading-8 lg:text-xl">
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
                      className="group flex min-h-[104px] items-start gap-3 rounded-[1.2rem] border border-white/[0.14] bg-white/[0.045] px-4 py-4 text-left shadow-[0_28px_60px_-38px_rgba(46,144,250,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.26] hover:bg-white/[0.08] sm:min-h-[120px] sm:gap-4 sm:rounded-[1.35rem] sm:px-5 sm:py-5"
                    >
                      <p.icon
                        size={20}
                        weight="duotone"
                        className="mt-0.5 flex-shrink-0 text-white transition-transform duration-200 group-hover:scale-110"
                      />
                      <div className="space-y-0.5 sm:space-y-1">
                        <p className="text-sm font-bold tracking-[-0.02em] text-white sm:text-base">
                          {p.label}
                        </p>
                        <p className="text-xs font-semibold leading-5 text-white sm:text-sm sm:leading-6">
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
                  "flex gap-3 animate-fade-up sm:gap-3.5",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Assistant avatar */}
                {msg.role === "assistant" && (
                  <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] shadow-[0_16px_34px_-26px_rgba(46,144,250,1)] sm:h-8 sm:w-8">
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
                      "text-sm font-semibold leading-7 text-white sm:text-base sm:leading-8 lg:text-lg",
                      msg.role === "user"
                        ? "max-w-xl rounded-[1.35rem] rounded-tr-md border border-white/[0.12] bg-white/[0.08] px-4 py-3.5 shadow-[0_30px_60px_-42px_rgba(255,255,255,0.65)] sm:rounded-[1.6rem] sm:px-5 sm:py-4"
                        : "max-w-3xl rounded-[1.35rem] rounded-tl-md border border-white/[0.08] bg-black/10 px-4 py-3.5 shadow-[0_30px_60px_-44px_rgba(46,144,250,0.6)] sm:rounded-[1.6rem] sm:px-5 sm:py-4"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <FormattedAssistantMessage
                        content={msg.content}
                        className="text-sm font-semibold leading-7 text-white sm:text-base sm:leading-8 lg:text-lg"
                      />
                    ) : (
                      msg.content
                    )}
                    {/* Streaming cursor */}
                    {msg.id === streamId && (
                      <span className="ml-0.5 inline-block h-[1.2em] w-[3px] animate-pulse bg-white align-middle" />
                    )}
                  </div>

                  {/* Action chips (shown after stream finishes) */}
                  {msg.actions && msg.actions.length > 0 && msg.id !== streamId && (
                    <div className="flex flex-wrap gap-2">
                      {msg.actions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => void applyAction(action)}
                          disabled={
                            isLoading ||
                            !!streamId ||
                            actionStatus[action.id] === "loading" ||
                            actionStatus[action.id] === "done"
                          }
                          className={cn(
                            "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold transition-colors sm:px-3.5 sm:text-sm",
                            actionStatus[action.id] === "done"
                              ? "border-success/35 bg-success/15 text-success"
                              : "border-white/[0.14] bg-white/[0.08] text-white hover:border-white/[0.26] hover:bg-white/[0.12]",
                            (isLoading ||
                              !!streamId ||
                              actionStatus[action.id] === "loading" ||
                              actionStatus[action.id] === "done") &&
                              "cursor-not-allowed opacity-70"
                          )}
                          aria-label={`Apply action: ${action.label}`}
                        >
                          {actionStatus[action.id] === "loading"
                            ? `Applying: ${action.label}`
                            : actionStatus[action.id] === "done"
                            ? `Applied: ${action.label}`
                            : action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-3 animate-fade-up sm:gap-3.5">
                <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] sm:h-8 sm:w-8">
                  <Lightning size={15} weight="fill" className="text-white" />
                </div>
                <div className="flex items-center gap-2 py-3.5 sm:py-4">
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
        <div className="relative z-10 flex-shrink-0 border-t border-white/[0.1] bg-black/10 px-4 py-2.5 backdrop-blur-sm sm:px-5 sm:py-3 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex min-h-[56px] items-center gap-3 rounded-[1.1rem] border border-white/[0.14] bg-white/[0.045] px-3.5 py-2.5 shadow-[0_32px_80px_-52px_rgba(46,144,250,0.95)] transition-colors focus-within:border-white/[0.28] sm:min-h-[62px] sm:gap-3.5 sm:rounded-[1.25rem] sm:px-4 sm:py-3">
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
                rows={1}
                style={{ maxHeight: 140 }}
                className="flex-1 resize-none bg-transparent py-2 text-sm font-semibold leading-6 text-white outline-none placeholder:text-white/55 disabled:opacity-50 sm:text-base sm:leading-7"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading || !!streamId}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-blue shadow-[0_24px_50px_-28px_rgba(46,144,250,1)] transition-all hover:scale-[1.03] hover:bg-[#4ba2fb] disabled:cursor-not-allowed disabled:opacity-35 sm:h-10 sm:w-10 sm:rounded-xl"
                aria-label="Send message"
              >
                <ArrowUp size={18} weight="bold" className="text-white" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-xs font-semibold text-white sm:mt-2 sm:text-xs">
              <kbd className="rounded-md border border-white/[0.14] bg-white/[0.06] px-1.5 py-0.5 font-mono text-white">Enter</kbd>{" "}
              to send ·{" "}
              <kbd className="rounded-md border border-white/[0.14] bg-white/[0.06] px-1.5 py-0.5 font-mono text-white">⇧ Enter</kbd>{" "}
              for newline
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
