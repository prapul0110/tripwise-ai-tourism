import { describe, expect, it } from "vitest";
import { calculateTripBudget, dayCount } from "../client/src/lib/tripMath";

describe("TripWise planning math", () => {
  it("uses a custom budget as the single source of truth for all budget categories", () => {
    const result = calculateTripBudget({ days: 3, travelers: 2, budgetTier: "Moderate", budgetAmount: 25000, styles: ["Beaches", "Adventure"] });
    expect(result.total).toBe(25000);
    expect(result.accommodation + result.food + result.transport + result.activities).toBe(25000);
    expect(result.activities).toBeGreaterThan(result.transport);
  });

  it("derives an inclusive trip duration within the allowed range", () => {
    expect(dayCount("2026-09-10", "2026-09-12")).toBe(3);
    expect(dayCount("2026-09-12", "2026-09-10")).toBe(1);
  });
});
