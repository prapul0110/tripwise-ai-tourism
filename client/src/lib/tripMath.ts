export type BudgetTier = "Budget" | "Moderate" | "Premium" | "Luxury";

export type TripInput = {
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  travelers: number;
  budgetTier: BudgetTier;
  budgetAmount?: number;
  styles: string[];
};

export type BudgetBreakdown = {
  accommodation: number;
  food: number;
  transport: number;
  activities: number;
  total: number;
  dailyPerTraveler: number;
};

const dailyRates: Record<BudgetTier, number> = {
  Budget: 2600,
  Moderate: 4700,
  Premium: 7900,
  Luxury: 12800,
};

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function calculateTripBudget(input: Pick<TripInput, "days" | "travelers" | "budgetTier" | "budgetAmount" | "styles">): BudgetBreakdown {
  const baseline = dailyRates[input.budgetTier] * input.days * input.travelers;
  const total = Math.max(1000, Math.round(input.budgetAmount || baseline));
  const activeStyles = input.styles.map(style => style.toLowerCase());
  const isAdventure = activeStyles.includes("adventure");
  const isFoodFocused = activeStyles.includes("food");
  const isRelaxed = activeStyles.includes("relaxation");

  const activityShare = isAdventure ? 0.24 : isRelaxed ? 0.14 : 0.19;
  const foodShare = isFoodFocused ? 0.27 : 0.22;
  const accommodationShare = 0.4;
  const transportShare = 1 - accommodationShare - foodShare - activityShare;

  const accommodation = Math.round(total * accommodationShare);
  const food = Math.round(total * foodShare);
  const activities = Math.round(total * activityShare);
  const transport = total - accommodation - food - activities;

  return {
    accommodation,
    food,
    transport,
    activities,
    total,
    dailyPerTraveler: Math.round(total / Math.max(1, input.days * input.travelers)),
  };
}

export function dayCount(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 3;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const difference = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(30, Number.isFinite(difference) ? difference : 3));
}
