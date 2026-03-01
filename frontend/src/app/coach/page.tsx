"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Send, Zap, TrendingUp, Trophy, Heart, CreditCard, Calendar, Loader2 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ChatWindow, type ChatMessage } from "@/components/coach/ChatWindow";
import chatResponses from "@/mocks/chat.json";

const RESPONSES = chatResponses.responses as Record<string, string>;
const TYPING_INTERVAL_MS = 10;

const SUGGESTED_PROMPTS = [
  { label: "Weekend spending?", icon: TrendingUp, query: "What will I spend this weekend?" },
  { label: "Create challenge", icon: Trophy, query: "Create a savings challenge for me" },
  { label: "Health score", icon: Heart, query: "How's my financial health?" },
  { label: "My balance", icon: CreditCard, query: "What's my balance?" },
  { label: "Calendar events", icon: Calendar, query: "What's on my calendar this week?" },
];

function pickResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("overspend")) return RESPONSES.overspend ?? "Based on your patterns...";
  if (lower.includes("afford") && (lower.includes("weekend") || lower.includes("out")))
    return RESPONSES.afford_weekend ?? "You can afford it if...";
  if (lower.includes("trigger")) return RESPONSES.trigger ?? "Your biggest trigger is...";
  if (lower.includes("savings") || lower.includes("goal")) return RESPONSES.savings_goal ?? "A good savings goal...";
  if (lower.includes("weekend") || lower.includes("spend this week")) return RESPONSES.afford_weekend ?? "This weekend you might spend...";
  if (lower.includes("challenge")) return "I can help you create a savings challenge. Try the Weekend Warrior or set a custom cap.";
  if (lower.includes("health") || lower.includes("score")) return "Your financial health score is looking good. Keep it up!";
  if (lower.includes("balance") || lower.includes("account")) return "Your projected balance this week is on track.";
  if (lower.includes("calendar")) return "You have a few events this week that may impact spending. Check your Calendar page.";
  return RESPONSES.default ?? "I'm here to help with spending predictions, challenges, and calendar insights. Ask me anything!";
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

  const sendMessage = useCallback((text: string) => {
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

    setTimeout(() => {
      const reply = pickResponse(trimmed);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
      setStreaming({ messageId: assistantMsg.id, fullText: reply });
    }, 800);
  }, []);

  return (
    <PageShell>
      <div className="flex flex-col h-full" style={{ height: "calc(100vh - 73px)" }}>
        {/* Header - Figma style */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-slate-800 font-semibold">FutureSpend AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-xs text-slate-400">Powered by multi-calendar intelligence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <ChatWindow
            messages={messages}
            loading={loading}
            streamingMessageId={streaming?.messageId ?? null}
            className="h-full min-h-[280px] border-0 rounded-none bg-transparent"
          />
        </div>

        {/* Suggested prompts - Figma style */}
        <div className="flex-shrink-0 px-6 py-2 bg-slate-50 border-t border-slate-100">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                onClick={() => sendMessage(prompt.query)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <prompt.icon className="w-3.5 h-3.5" />
                {prompt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your spending, challenges, or calendar..."
              disabled={loading}
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-400 placeholder-slate-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </form>
          <p className="text-xs text-slate-400 text-center mt-2">
            AI responses are simulated for demo purposes
          </p>
        </div>
      </div>
    </PageShell>
  );
}
