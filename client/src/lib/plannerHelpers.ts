import type { BudgetTier } from "@/lib/tripMath";

export type PlannerForm = {
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  travelers: number;
  budgetTier: BudgetTier | "";
  budgetAmount: number | "";
  styles: string[];
};

export const blankPlannerForm: PlannerForm = {
  destination: "",
  startDate: "",
  endDate: "",
  days: 0,
  travelers: 0,
  budgetTier: "",
  budgetAmount: "",
  styles: [],
};

export function addDaysToDateString(dateStr: string, daysToAdd = 1): string {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr || "0", 10);
  const month = parseInt(monthStr || "1", 10) - 1;
  const day = parseInt(dayStr || "1", 10);

  const d = new Date(year, month, day + daysToAdd);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${date}`;
}

export function computeDuration(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) return 0;
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return diff > 0 ? Math.min(30, diff) : 0;
}

/**
 * Automatically adjusts departure date when arrival date is changed on or after departure date.
 * - When arrival date is changed to a date on or after the current departure date, automatically sets departure to arrival + 1 day.
 * - Preserves valid existing date selections.
 * - Prevents invalid or zero-day trips when both dates are present.
 * - Preserves blank initial state when either date is unset.
 */
export function adjustPlannerDates(
  currentStart: string,
  currentEnd: string,
  updatedField: "startDate" | "endDate",
  newValue: string
): { startDate: string; endDate: string; days: number } {
  let startDate = updatedField === "startDate" ? newValue : currentStart;
  let endDate = updatedField === "endDate" ? newValue : currentEnd;

  if (updatedField === "startDate" && newValue && currentEnd) {
    if (newValue >= currentEnd) {
      endDate = addDaysToDateString(newValue, 1);
    }
  }

  const days = startDate && endDate && endDate >= startDate
    ? computeDuration(startDate, endDate)
    : 0;

  return { startDate, endDate, days };
}

export function validatePlannerForm(values: PlannerForm): Record<string, string> {
  const newErrors: Record<string, string> = {};

  if (!values.destination || !values.destination.trim()) {
    newErrors.destination = "Please select a destination.";
  }

  if (!values.startDate) {
    newErrors.startDate = "Please select an arrival date.";
  }

  if (!values.endDate) {
    newErrors.endDate = "Please select a departure date.";
  } else if (values.startDate && values.endDate < values.startDate) {
    newErrors.endDate = "Departure date must be on or after arrival date.";
  }

  if (!values.days || values.days < 1) {
    newErrors.days = "Please select or calculate trip duration.";
  } else if (values.days > 30) {
    newErrors.days = "Duration cannot exceed 30 days.";
  }

  if (!values.travelers || values.travelers < 1) {
    newErrors.travelers = "Please select number of travellers.";
  } else if (values.travelers > 20) {
    newErrors.travelers = "Maximum 20 travellers allowed.";
  }

  if (!values.budgetTier) {
    newErrors.budgetTier = "Please select a budget style.";
  }

  if (values.budgetAmount === "" || values.budgetAmount === undefined || values.budgetAmount === null) {
    newErrors.budgetAmount = "Please enter your total allowance.";
  } else if (Number(values.budgetAmount) < 1000) {
    newErrors.budgetAmount = "Total allowance must be at least ₹1,000.";
  } else if (Number(values.budgetAmount) > 2000000) {
    newErrors.budgetAmount = "Total allowance cannot exceed ₹20,00,000.";
  }

  if (!values.styles || values.styles.length === 0) {
    newErrors.styles = "Please select at least one travel style.";
  }

  return newErrors;
}
