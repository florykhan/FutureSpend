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
import { cn } from "@/lib/utils";
import chatResponses from "@/mocks/chat.json";

/* ─── Types ─── */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  /** Action chips returned from the backend (e.g. "Lock $50", "Create challenge") */
  actions?: Array<{ id: string; label: string; impact: string; type: string }>;
}

/* ─── Mock fallback (remove when backend is wired) ─── */

const FALLBACK = chatResponses.responses as Record<string, string>;

function pickFallback(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("overspend")) return FALLBACK.overspend ?? "Based on your patterns...";
  if (lower.includes("afford") && (lower.includes("weekend") || lower.includes("out")))
    return FALLBACK.afford_weekend ?? "You can afford it.";
  if (lower.includes("trigger")) return FALLBACK.trigger ?? "Your biggest trigger is...";
  if (lower.includes("savings") || lower.includes("goal")) return FALLBACK.savings_goal ?? "A good savings goal...";
  if (lower.includes("weekend") || lower.includes("spend this week"))
    return FALLBACK.afford_weekend ?? "This weekend you might spend...";
  if (lower.includes("challenge")) return "I can help you create a savings challenge. Try the Weekend Warrior or set a custom cap.";
  if (lower.includes("health") || lower.includes("score")) return "Your financial health score is looking good. Keep it up!";
  if (lower.includes("balance") || lower.includes("account")) return "Your projected balance this week is on track.";
  if (lower.includes("calendar")) return "You have a few events this week that may impact spending. Check your Calendar page.";
  return FALLBACK.default ?? "I'm here to help with spending predictions, challenges, and calendar insights.";
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

  /* ─── Auto-resize textarea (up to 5 lines) ─── */
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  /* ─── Send message ─── */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

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
        // ── LIVE: calls api.coachChat(message, session_id, events, monthly_budget) ──
        try {
          const res = await api.coachChat(trimmed);
          startStream(res.reply.content, res.actions);
        } catch {
          startStream(pickFallback(trimmed));
        }
      } else {
        // ── MOCK: remove this block once backend is ready ──
        await new Promise((r) => setTimeout(r, 500));
        startStream(pickFallback(trimmed));
      }
    },
    [isLoading]
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
      <div className="flex h-full flex-col overflow-hidden">
        {/* ─── Header ─── */}
        <div className="flex-shrink-0 flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue/30 to-accent-purple/30 border border-accent-blue/20">
            <Lightning size={17} weight="fill" className="text-accent-blue" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-0 bg-success" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">FutureSpend Coach</p>
            <p className="text-xs text-gray-600">Powered by multi-calendar intelligence</p>
          </div>
        </div>

        {/* ─── Messages viewport ─── */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">

            {/* Welcome screen (shown when no messages) */}
            {isEmpty && (
              <div className="flex flex-col items-center gap-8 py-10 animate-fade-up">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold text-white tracking-tight">
                    Good to see you.
                  </h1>
                  <p className="mt-1.5 text-sm text-gray-500">
                    Ask anything about your spending or pick a prompt below.
                  </p>
                </div>

                {/* Prompt grid — 2 columns */}
                <div className="grid w-full max-w-lg grid-cols-2 gap-2">
                  {PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => sendMessage(p.query)}
                      className="group flex items-start gap-3 rounded-xl border border-white/[0.07] bg-surface-1 px-4 py-3.5 text-left transition-all duration-150 hover:border-white/[0.13] hover:bg-surface-3"
                    >
                      <p.icon
                        size={15}
                        weight="duotone"
                        className="mt-0.5 flex-shrink-0 text-gray-600 transition-colors group-hover:text-accent-blue"
                      />
                      <div>
                        <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                          {p.label}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
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
                  "flex gap-2.5 animate-fade-up",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Assistant avatar */}
                {msg.role === "assistant" && (
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border border-accent-blue/20 bg-accent-blue/10">
                    <Lightning size={12} weight="fill" className="text-accent-blue" />
                  </div>
                )}

                <div
                  className={cn(
                    "flex flex-col gap-1.5",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {/* Bubble */}
                  <div
                    className={cn(
                      "text-sm leading-relaxed",
                      msg.role === "user"
                        ? "max-w-sm rounded-2xl rounded-tr-sm bg-surface-4 px-4 py-2.5 text-gray-100"
                        : "max-w-prose rounded-2xl rounded-tl-sm px-0 py-0 text-gray-300"
                    )}
                  >
                    {msg.content}
                    {/* Streaming cursor */}
                    {msg.id === streamId && (
                      <span className="ml-0.5 inline-block h-[14px] w-[2px] animate-pulse bg-accent-blue align-middle" />
                    )}
                  </div>

                  {/* Action chips (shown after stream finishes) */}
                  {msg.actions && msg.actions.length > 0 && msg.id !== streamId && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.actions.map((action) => (
                        <span
                          key={action.id}
                          className="inline-flex items-center rounded-full border border-accent-blue/25 bg-accent-blue/10 px-2.5 py-1 text-xs font-medium text-accent-blue"
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
              <div className="flex gap-2.5 animate-fade-up">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border border-accent-blue/20 bg-accent-blue/10">
                  <Lightning size={12} weight="fill" className="text-accent-blue" />
                </div>
                <div className="flex items-center gap-1.5 py-3">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-gray-600 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-gray-600 animate-bounce"
                    style={{ animationDelay: "160ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-gray-600 animate-bounce"
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
        <div className="flex-shrink-0 border-t border-white/[0.06] px-4 py-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-end gap-3 rounded-2xl border border-white/[0.08] bg-surface-1 px-4 py-3 transition-colors focus-within:border-white/[0.16]">
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
                style={{ maxHeight: 120 }}
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-white outline-none placeholder:text-gray-700 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading || !!streamId}
                className="mb-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-blue transition-all hover:bg-accent-blue/80 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Send message"
              >
                <ArrowUp size={13} weight="bold" className="text-white" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-700">
              <kbd className="rounded bg-surface-3 px-1 py-0.5 font-mono text-gray-600">Enter</kbd>{" "}
              to send ·{" "}
              <kbd className="rounded bg-surface-3 px-1 py-0.5 font-mono text-gray-600">⇧ Enter</kbd>{" "}
              for newline
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
