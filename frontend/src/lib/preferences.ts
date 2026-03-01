const MONTHLY_BUDGET_KEY = "futurespend_budget";

export const DEFAULT_MONTHLY_BUDGET = 1800;

function parseStoredNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

export function getStoredMonthlyBudget(): number {
  if (typeof window === "undefined") {
    return DEFAULT_MONTHLY_BUDGET;
  }
  return parseStoredNumber(
    window.localStorage.getItem(MONTHLY_BUDGET_KEY),
    DEFAULT_MONTHLY_BUDGET
  );
}

export function setStoredMonthlyBudget(value: number): void {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = Number.isFinite(value) && value >= 0 ? value : DEFAULT_MONTHLY_BUDGET;
  window.localStorage.setItem(MONTHLY_BUDGET_KEY, String(normalized));
}
