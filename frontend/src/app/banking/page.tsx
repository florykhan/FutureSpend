"use client";

import { type CSSProperties, useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Lock,
  LockOpen,
  TrendUp,
  TrendDown,
  ArrowUpRight,
  ArrowDownLeft,
  Lightning,
  ShieldCheck,
  Plus,
  Minus,
  Wallet,
  ChartBar,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PageShell } from "@/components/layout/PageShell";
import { api } from "@/lib/api";
import { CATEGORY_COLORS, CHART_TOOLTIP_STYLE } from "@/lib/constants";
import { getDashboardTypographyVars } from "@/lib/typography";
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
  ...CATEGORY_COLORS,
  coffee: CATEGORY_COLORS.shopping,
  groceries: "#06AED4",
  income: CATEGORY_COLORS.transport,
  meal: CATEGORY_COLORS.food,
};

type BankData = {
  accountName: string;
  balance: number;
  vaultAmount: number;
  availableBalance: number;
  transactions: Array<{
    id: string;
    date: string;
    merchant: string;
    category: string;
    amount: number;
    balance: number;
  }>;
  nomiInsights: Array<{
    category: string;
    thisMonth: number;
    lastMonth: number;
    trend: string;
    change: number;
  }>;
};

const fallbackBank = bankDataJson as BankData;

export default function BankingPage() {
  const [balance, setBalance] = useState(fallbackBank.balance);
  const [vaultAmount, setVaultAmount] = useState(fallbackBank.vaultAmount);
  const [vaultInput, setVaultInput] = useState("");
  const [vaultMode, setVaultMode] = useState<"add" | "remove" | null>(null);
  const [showVaultConfirm, setShowVaultConfirm] = useState(false);
  const [loading, setLoading] = useState(!!process.env.NEXT_PUBLIC_API_URL);

  const fetchSummary = useCallback(() => {
    if (!process.env.NEXT_PUBLIC_API_URL) return;
    api
      .bankSummary()
      .then((s) => {
        setBalance(s.total);
        setVaultAmount(s.vaults?.default ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      setLoading(false);
      return;
    }
    fetchSummary();
  }, [fetchSummary]);

  const available = balance - vaultAmount;
  const bankData = {
    ...fallbackBank,
    balance,
    vaultAmount,
    availableBalance: available,
  };

  const handleVaultChange = (mode: "add" | "remove") => {
    const amt = parseFloat(vaultInput);
    if (isNaN(amt) || amt <= 0) return;
    if (process.env.NEXT_PUBLIC_API_URL) {
      const fn = mode === "add" ? api.bankLock : api.bankUnlock;
      fn(amt, "default", mode === "add" ? "savings" : "withdrawal")
        .then((res) => {
          if (res.ok !== false) {
            setShowVaultConfirm(true);
            setTimeout(() => setShowVaultConfirm(false), 3000);
            fetchSummary();
          }
        })
        .catch(() => {});
    } else {
      if (mode === "add") {
        setVaultAmount((prev) => Math.min(prev + amt, balance));
      } else {
        setVaultAmount((prev) => Math.max(prev - amt, 0));
      }
      setShowVaultConfirm(true);
      setTimeout(() => setShowVaultConfirm(false), 3000);
    }
    setVaultInput("");
    setVaultMode(null);
  };

  const nomiChartData = bankData.nomiInsights.map((insight) => ({
    name: insight.category.replace(" ", "\n"),
    thisMonth: insight.thisMonth,
    lastMonth: insight.lastMonth,
  }));

  if (loading && process.env.NEXT_PUBLIC_API_URL) {
    return (
      <PageShell>
        <div className="p-4 flex items-center justify-center min-h-[200px]">
          <p className="text-gray-500 text-sm font-medium">
            Loading bank summary...
          </p>
        </div>
      </PageShell>
    );
  }

  const vaultPercent = Math.round((vaultAmount / bankData.balance) * 100);
  const availPercent = 100 - vaultPercent;

  return (
    <PageShell>
      <div
        className="p-6 lg:p-8 space-y-7 dashboard-typography"
        style={getDashboardTypographyVars() as CSSProperties}
      >
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-accent-blue/15 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <h2 className="text-gray-100 text-xl lg:text-2xl font-semibold tracking-tight">
                RBC Banking
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Mock integration · Nomi-enhanced
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-accent-blue-muted border border-accent-blue/20 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse" />
            <span className="text-sm text-accent-blue font-medium">
              Live sync
            </span>
          </div>
        </div>

        {/* Balance Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up"
          style={{ animationDelay: "60ms" }}
        >
          {/* Total Balance */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <Wallet className="w-5 h-5 text-gray-500" />
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">
                {bankData.accountName}
              </p>
            </div>
            <div className="text-3xl font-semibold text-gray-100 font-mono tabular-nums">
              $
              {bankData.balance.toLocaleString("en-CA", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-base text-gray-500 mt-1 font-medium">
              Total Balance
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-blue rounded-full progress-bar"
                  style={{ width: `${availPercent}%` }}
                />
              </div>
              <span className="text-sm text-gray-400 font-mono font-medium tabular-nums">
                {availPercent}% free
              </span>
            </div>
          </div>

          {/* Available */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-success-muted rounded-md flex items-center justify-center">
                <LockOpen className="w-4 h-4 text-success" />
              </div>
              <span className="text-base text-gray-400 font-medium">
                Available
              </span>
            </div>
            <div className="text-3xl text-gray-100 font-semibold font-mono tabular-nums">
              $
              {available.toLocaleString("en-CA", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Free to spend
            </p>
          </div>

          {/* Vault */}
          <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-success-muted rounded-md flex items-center justify-center">
                <Lock className="w-4 h-4 text-success" />
              </div>
              <span className="text-base text-gray-400 font-medium">
                Savings Vault
              </span>
            </div>
            <div className="text-3xl text-success font-semibold font-mono tabular-nums">
              $
              {vaultAmount.toLocaleString("en-CA", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Locked for savings
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          {/* Transactions */}
          <div className="lg:col-span-2 bg-surface-1 border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-base text-gray-200 font-semibold">
                Recent Transactions
              </h3>
              <span className="text-sm text-gray-600 font-mono">
                Last 8 transactions
              </span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {bankData.transactions.map((tx) => {
                const isIncome = tx.amount > 0;
                const icon = categoryIcons[tx.category] || "💳";
                const color = categoryColors[tx.category] || "#737373";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: color + "18" }}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-gray-100 font-medium">
                        {tx.merchant}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5 font-mono">
                        {tx.date} · {tx.category}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p
                          className={`text-base font-semibold font-mono tabular-nums ${
                            isIncome ? "text-success" : "text-gray-100"
                          }`}
                        >
                          {isIncome ? "+" : ""}$
                          {Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 font-mono tabular-nums">
                          bal: ${tx.balance.toFixed(2)}
                        </p>
                      </div>
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4 text-success flex-shrink-0" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Vault Card */}
            <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-success" />
                <h3 className="text-gray-100 font-semibold text-base">
                  Savings Vault
                </h3>
              </div>

              {showVaultConfirm && (
                <div className="mb-4 bg-success-muted border border-success/20 rounded-lg p-3 text-sm text-success font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Vault updated
                  successfully!
                </div>
              )}

              <div className="relative flex justify-center mb-4">
                <div className="w-28 h-28 relative">
                  <svg
                    viewBox="0 0 36 36"
                    className="w-28 h-28 -rotate-90"
                  >
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10A861"
                      strokeWidth="3"
                      strokeDasharray={`${vaultPercent}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Lock className="w-4 h-4 text-success mb-0.5" />
                    <span className="text-base text-success font-semibold font-mono">
                      {vaultPercent}%
                    </span>
                    <span className="text-sm text-gray-600 font-medium">
                      locked
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-xl text-success font-semibold font-mono tabular-nums">
                  $
                  {vaultAmount.toLocaleString("en-CA", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  locked in vault
                </p>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() =>
                    setVaultMode(vaultMode === "add" ? null : "add")
                  }
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-base font-medium border transition-all ${
                    vaultMode === "add"
                      ? "bg-success text-white border-success"
                      : "bg-success-muted text-success border-success/20 hover:bg-success/20"
                  }`}
                >
                  <Plus className="w-4 h-4" /> Lock
                </button>
                <button
                  onClick={() =>
                    setVaultMode(vaultMode === "remove" ? null : "remove")
                  }
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-base font-medium border transition-all ${
                    vaultMode === "remove"
                      ? "bg-warning text-white border-warning"
                      : "bg-warning-muted text-warning border-warning/20 hover:bg-warning/20"
                  }`}
                >
                  <Minus className="w-4 h-4" /> Unlock
                </button>
              </div>

              {vaultMode && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={vaultInput}
                    onChange={(e) => setVaultInput(e.target.value)}
                    placeholder="Amount"
                    className="flex-1 border border-white/[0.08] bg-surface-3 rounded-lg px-3 py-2.5 text-base text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 font-mono"
                  />
                  <button
                    onClick={() => handleVaultChange(vaultMode)}
                    className="px-4 py-2.5 bg-accent-blue text-white rounded-lg text-base font-semibold hover:bg-accent-blue/80 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Nomi Insights */}
            <div className="bg-surface-1 border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <ChartBar className="w-5 h-5 text-accent-blue" />
                <h3 className="text-gray-100 font-semibold text-base">
                  Nomi Insights
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 font-medium">
                This month vs last month
              </p>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart
                  data={nomiChartData}
                  margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#71717a", fontWeight: 500 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(v: number) => [`$${v}`, ""]}
                  />
                  <Bar
                    dataKey="lastMonth"
                    fill="rgba(255,255,255,0.08)"
                    radius={4}
                    name="Last Month"
                  />
                  <Bar
                    dataKey="thisMonth"
                    fill="#2E90FA"
                    radius={4}
                    name="This Month"
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2.5">
                {bankData.nomiInsights.map((insight) => (
                  <div
                    key={insight.category}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-400 font-medium">
                      {insight.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {insight.trend === "down" ? (
                        <TrendDown className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <TrendUp className="w-3.5 h-3.5 text-destructive" />
                      )}
                      <span
                        className={`text-sm font-semibold font-mono tabular-nums ${
                          insight.trend === "down"
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {insight.change > 0 ? "+" : ""}
                        {insight.change}%
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
