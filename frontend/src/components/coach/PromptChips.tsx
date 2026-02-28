"use client";

import { cn } from "@/lib/utils";

interface PromptChipsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PromptChips({ prompts, onSelect, disabled, className }: PromptChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
