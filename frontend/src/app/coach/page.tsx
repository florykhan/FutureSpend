"use client";

import { useState, useCallback } from "react";
import { Send } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ChatWindow, type ChatMessage } from "@/components/coach/ChatWindow";
import { PromptChips } from "@/components/coach/PromptChips";
import { Button } from "@/components/ui/Button";
import { SUGGESTED_PROMPTS } from "@/lib/constants";
import chatResponses from "@/mocks/chat.json";

const RESPONSES = chatResponses.responses as Record<string, string>;

function pickResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("overspend")) return RESPONSES.overspend;
  if (lower.includes("afford") && (lower.includes("weekend") || lower.includes("out")))
    return RESPONSES.afford_weekend;
  if (lower.includes("trigger")) return RESPONSES.trigger;
  if (lower.includes("savings") || lower.includes("goal")) return RESPONSES.savings_goal;
  return RESPONSES.default;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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

      setTimeout(() => {
        const reply = pickResponse(trimmed);
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setLoading(false);
      }, 800);
    },
    []
  );

  return (
    <PageShell>
      <div className="flex h-[calc(100vh-3.5rem)] flex-col p-4 md:p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">AI Coach</h1>
          <p className="text-slate-600">Ask about your spending and savings</p>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <div className="min-h-0 flex-1">
            <ChatWindow messages={messages} loading={loading} className="h-full min-h-[280px]" />
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
