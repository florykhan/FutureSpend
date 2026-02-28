"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CreateChallengeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: { name: string; goal: number; unit: string }) => void;
}

export function CreateChallengeModal({ open, onClose, onSubmit }: CreateChallengeModalProps) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [unit, setUnit] = useState("CAD");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(goal);
    if (name.trim() && !isNaN(num) && num > 0) {
      onSubmit?.({ name: name.trim(), goal: num, unit });
      setName("");
      setGoal("");
      setUnit("CAD");
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-challenge-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="create-challenge-title" className="text-lg font-semibold text-slate-900">
            Create challenge
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="challenge-name" className="block text-sm font-medium text-slate-700">
              Challenge name
            </label>
            <input
              id="challenge-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. No Coffee Week"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              required
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="challenge-goal" className="block text-sm font-medium text-slate-700">
                Goal
              </label>
              <input
                id="challenge-goal"
                type="number"
                min="1"
                step="any"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="200"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div className="w-24">
              <label htmlFor="challenge-unit" className="block text-sm font-medium text-slate-700">
                Unit
              </label>
              <select
                id="challenge-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="CAD">CAD</option>
                <option value="USD">USD</option>
                <option value="meals">meals</option>
                <option value="days">days</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create (mock)</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
