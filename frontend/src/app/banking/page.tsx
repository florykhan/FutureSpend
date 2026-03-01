"use client";

import { useState } from "react";
import {
  CreditCard,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  ShieldCheck,
  Plus,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PageShell } from "@/components/layout/PageShell";
import bankDataJson from "@/mocks/banking.json";

const categoryIcons: Record<string, string> = {
  coffee: "☕",
  transport: "🚗",
  groceries: "🛒",
  income: "💰",
  entertainment: "🎬",
  meal: "🍽️",
};

const categoryColors: Record<string, string> = {
  coffee: "#8b5cf6",
  transport: "#10b981",
  groceries: "#06b6d4",
  income: "#10b981",
  entertainment: "#f59e0b",
  meal: "#3b82f6",
  other: "#6b7280",
};

type BankData = {
  accountName: string;
  balance: number;
  vaultAmount: number;
  availableBalance: number;
  transactions: Array<{ id: string; date: string; merchant: string; category: string; amount: number; balance: number }>;
  nomiInsights: Array<{ category: string; thisMonth: number; lastMonth: number; trend: string; change: number }>;
};

const bankData = bankDataJson as BankData;

export default function BankingPage() {
  const [vaultAmount, setVaultAmount] = useState(bankData.vaultAmount);
  const [vaultInput, setVaultInput] = useState("");
  const [vaultMode, setVaultMode] = useState<"add" | "remove" | null>(null);
  const [showVaultConfirm, setShowVaultConfirm] = useState(false);

  const available = bankData.balance - vaultAmount;

  const handleVaultChange = (mode: "add" | "remove") => {
    const amt = parseFloat(vaultInput);
    if (isNaN(amt) || amt <= 0) return;
    if (mode === "add") {
      setVaultAmount((prev) => Math.min(prev + amt, bankData.balance));
    } else {
      setVaultAmount((prev) => Math.max(prev - amt, 0));
    }
    setVaultInput("");
    setVaultMode(null);
    setShowVaultConfirm(true);
    setTimeout(() => setShowVaultConfirm(false), 3000);
  };

  const nomiChartData = bankData.nomiInsights.map((insight) => ({
    name: insight.category.replace(" ", "\n"),
    thisMonth: insight.thisMonth,
    lastMonth: insight.lastMonth,
  }));

  return (
    <PageShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-slate-900 font-semibold">RBC Banking</h2>
              <p className="text-sm text-slate-500">Mock integration · Nomi-enhanced</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-blue-700">Live sync active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl p-5 text-white col-span-1">
            <p className="text-xs text-blue-300 mb-1">{bankData.accountName}</p>
            <div className="text-3xl mb-1 font-bold">${bankData.balance.toLocaleString("en-CA", { minimumFractionDigits: 2 })}</div>
            <p className="text-sm text-blue-200">Total Balance</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1 bg-blue-600 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${(available / bankData.balance) * 100}%` }} />
              </div>
              <span className="text-xs text-blue-300">{Math.round((available / bankData.balance) * 100)}% free</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Unlock className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600">Available</span>
            </div>
            <div className="text-2xl text-slate-900 font-bold">${available.toLocaleString("en-CA", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-400 mt-1">Free to spend</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm bg-emerald-50/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm text-slate-600">Savings Vault</span>
            </div>
            <div className="text-2xl text-emerald-700 font-bold">${vaultAmount.toLocaleString("en-CA", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-400 mt-1">Locked for savings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 font-medium">Recent Transactions</h3>
              <span className="text-xs text-slate-400">Last 8 transactions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {bankData.transactions.map((tx) => {
                const isIncome = tx.amount > 0;
                const icon = categoryIcons[tx.category] || "💳";
                const color = categoryColors[tx.category] || "#6b7280";
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: color + "20" }}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium">{tx.merchant}</p>
                      <p className="text-xs text-slate-400">{tx.date} · {tx.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${isIncome ? "text-emerald-600" : "text-slate-800"} font-semibold`}>
                        {isIncome ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">bal: ${tx.balance.toFixed(2)}</p>
                    </div>
                    {isIncome ? <ArrowDownLeft className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <ArrowUpRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-slate-800 font-medium">Savings Vault</h3>
              </div>

              {showVaultConfirm && (
                <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Vault updated successfully!
                </div>
              )}

              <div className="relative flex justify-center mb-4">
                <div className="w-28 h-28 relative">
                  <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray={`${(vaultAmount / bankData.balance) * 100}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Lock className="w-4 h-4 text-emerald-600 mb-0.5" />
                    <span className="text-sm text-emerald-700 font-bold">{Math.round((vaultAmount / bankData.balance) * 100)}%</span>
                    <span className="text-xs text-slate-400" style={{ fontSize: "9px" }}>locked</span>
                  </div>
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-lg text-emerald-700 font-bold">${vaultAmount.toLocaleString("en-CA", { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-slate-400">locked in vault</p>
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setVaultMode(vaultMode === "add" ? null : "add")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm border transition-all ${
                    vaultMode === "add" ? "bg-emerald-600 text-white border-emerald-600" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Lock More
                </button>
                <button
                  onClick={() => setVaultMode(vaultMode === "remove" ? null : "remove")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm border transition-all ${
                    vaultMode === "remove" ? "bg-amber-500 text-white border-amber-500" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" /> Unlock
                </button>
              </div>

              {vaultMode && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={vaultInput}
                    onChange={(e) => setVaultInput(e.target.value)}
                    placeholder="Amount"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={() => handleVaultChange(vaultMode)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                    Apply
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-blue-600" />
                <h3 className="text-slate-800 font-medium">Nomi Insights</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">This month vs last month</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={nomiChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ fontSize: 11, border: "1px solid #e2e8f0", borderRadius: 8 }} formatter={(v: number) => [`$${v}`, ""]} />
                  <Bar dataKey="lastMonth" fill="#e2e8f0" radius={3} name="Last Month" />
                  <Bar dataKey="thisMonth" fill="#3b82f6" radius={3} name="This Month" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {bankData.nomiInsights.map((insight) => (
                  <div key={insight.category} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{insight.category}</span>
                    <div className="flex items-center gap-1.5">
                      {insight.trend === "down" ? <TrendingDown className="w-3 h-3 text-emerald-500" /> : <TrendingUp className="w-3 h-3 text-red-500" />}
                      <span className={`text-xs ${insight.trend === "down" ? "text-emerald-600" : "text-red-500"} font-medium`}>
                        {insight.change > 0 ? "+" : ""}{insight.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
