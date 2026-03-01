"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ChatWindow, type ChatMessage } from "@/components/coach/ChatWindow";
import { PromptChips } from "@/components/coach/PromptChips";
import { Button } from "@/components/ui/Button";
import { SUGGESTED_PROMPTS } from "@/lib/constants";
import chatFallback from "@/mocks/chat.json";

const FALLBACK_RESPONSES = chatFallback.responses as Record<string, string>;
const TYPING_INTERVAL_MS = 10;

function pickFallbackResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("overspend")) return FALLBACK_RESPONSES.overspend;
  if (lower.includes("afford") && (lower.includes("weekend") || lower.includes("out")))
    return FALLBACK_RESPONSES.afford_weekend;
  if (lower.includes("trigger")) return FALLBACK_RESPONSES.trigger;
  if (lower.includes("savings") || lower.includes("goal")) return FALLBACK_RESPONSES.savings_goal;
  return FALLBACK_RESPONSES.default;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState<{ messageId: string; fullText: string } | null>(null);
  const typingIndexRef = useRef(0);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!streaming) return;
    const { messageId, fullText } = streaming;
    typingIndexRef.current = 0;
    intervalIdRef.current = setInterval(() => {
      typingIndexRef.current += 1;
      const index = typingIndexRef.current;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: fullText.slice(0, index) } : m
        )
      );
      if (index >= fullText.length) {
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
        setStreaming(null);
      }
    }, TYPING_INTERVAL_MS);
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    };
  }, [streaming?.messageId, streaming?.fullText]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      (async () => {
        let replyText: string;
        try {
          const res = await fetch("/api/coach/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: trimmed }),
          });
          if (!res.ok) throw new Error(`${res.status}`);
          const data = await res.json();
          replyText = data.reply?.content ?? pickFallbackResponse(trimmed);
        } catch {
          // Fallback to local keyword-matching if backend is unreachable
          replyText = pickFallbackResponse(trimmed);
        }

        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setLoading(false);
        setStreaming({ messageId: assistantMsg.id, fullText: replyText });
      })();
    },
    []
  );

  return (
    <PageShell>
      <div className="flex h-[calc(100vh-3.5rem)] flex-col p-4 md:p-6">
        <div className="mb-4">
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
          <MessageCircle className="h-6 w-6 text-primary-600" aria-hidden />
          AI Coach
        </h1>
          <p className="text-slate-600">Ask about your spending and savings</p>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <div className="min-h-0 flex-1">
            <ChatWindow
            messages={messages}
            loading={loading}
            streamingMessageId={streaming?.messageId ?? null}
            className="h-full min-h-[280px]"
          />
          </div>

          <div className="flex-shrink-0 space-y-3">
            <PromptChips
              prompts={SUGGESTED_PROMPTS}
              onSelect={sendMessage}
              disabled={loading}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                disabled={loading}
              />
              <Button type="submit" disabled={loading} className="gap-2">
                <Send className="h-4 w-4" />
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
