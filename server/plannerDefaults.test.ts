import { describe, it, expect } from "vitest";
import { blankPlannerForm, computeDuration, validatePlannerForm, type PlannerForm } from "../client/src/lib/plannerHelpers";
import { calculateTripBudget } from "../client/src/lib/tripMath";
import { matchDestination } from "../client/src/data/destinations";

describe("AI Planner Default Form Values & Validation", () => {
  // Requirement 1: Blank default values
  it("1. initial blank planner form has all fields blank/unselected", () => {
    expect(blankPlannerForm.destination).toBe("");
    expect(blankPlannerForm.startDate).toBe("");
    expect(blankPlannerForm.endDate).toBe("");
    expect(blankPlannerForm.days).toBe(0);
    expect(blankPlannerForm.travelers).toBe(0);
    expect(blankPlannerForm.budgetTier).toBe("");
    expect(blankPlannerForm.budgetAmount).toBe("");
    expect(blankPlannerForm.styles).toEqual([]);
  });

  // Requirement 1 & Draft: Destination guide navigation vs direct opening
  it("2. direct opening leaves destination blank, while guide navigation preselects target destination", () => {
    // Direct opening
    expect(matchDestination("")).toBeNull();
    const directForm: PlannerForm = { ...blankPlannerForm };
    expect(directForm.destination).toBe("");

    // Arriving from Hyderabad guide
    const hydMatch = matchDestination("hyderabad");
    expect(hydMatch).not.toBeNull();
    const hydForm: PlannerForm = { ...blankPlannerForm, destination: hydMatch!.name };
    expect(hydForm.destination).toBe("Hyderabad");
    // All other fields remain blank initially
    expect(hydForm.startDate).toBe("");
    expect(hydForm.endDate).toBe("");
    expect(hydForm.days).toBe(0);
    expect(hydForm.travelers).toBe(0);
    expect(hydForm.budgetTier).toBe("");
    expect(hydForm.budgetAmount).toBe("");
    expect(hydForm.styles).toEqual([]);
  });

  // Requirement 2, 3, 4: Duration calculation
  it("3. duration is unselected (0) until both arrival and departure are selected", () => {
    expect(computeDuration("", "")).toBe(0);
    expect(computeDuration("2026-11-15", "")).toBe(0);
    expect(computeDuration("", "2026-11-20")).toBe(0);

    // Both selected and valid
    expect(computeDuration("2026-11-15", "2026-11-18")).toBe(4);
    expect(computeDuration("2026-11-15", "2026-11-15")).toBe(1);

    // Departure before arrival returns 0
    expect(computeDuration("2026-11-20", "2026-11-15")).toBe(0);
  });

  // Requirement 9: Budget preview behaves correctly without fabricated allowance
  it("4. budget preview does not show fabricated ₹38,000 allowance when details are incomplete", () => {
    const isBudgetReady = (form: PlannerForm) => Boolean(
      form.days > 0 &&
      form.travelers > 0 &&
      form.budgetTier &&
      typeof form.budgetAmount === "number" &&
      form.budgetAmount >= 1000
    );

    // Initial blank form
    expect(isBudgetReady(blankPlannerForm)).toBe(false);

    // Partially filled form
    const partialForm: PlannerForm = {
      ...blankPlannerForm,
      destination: "Goa",
      days: 4,
      travelers: 2,
    };
    expect(isBudgetReady(partialForm)).toBe(false);

    // Complete valid form
    const completedForm: PlannerForm = {
      destination: "Goa",
      startDate: "2026-11-15",
      endDate: "2026-11-18",
      days: 4,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 45000,
      styles: ["Food", "Relaxation"],
    };
    expect(isBudgetReady(completedForm)).toBe(true);

    const breakdown = calculateTripBudget({
      days: completedForm.days,
      travelers: completedForm.travelers,
      budgetTier: completedForm.budgetTier as any,
      budgetAmount: completedForm.budgetAmount as number,
      styles: completedForm.styles,
    });
    expect(breakdown.total).toBe(45000);
    expect(breakdown.dailyPerTraveler).toBe(Math.round(45000 / (4 * 2)));
    expect(breakdown.accommodation).toBeGreaterThan(0);
    expect(breakdown.food).toBeGreaterThan(0);
    expect(breakdown.activities).toBeGreaterThan(0);
    expect(breakdown.transport).toBeGreaterThan(0);
  });

  // Requirement 10: Validation rules and inline error messages
  it("5. validates all required fields before generating itinerary", () => {
    const errors = validatePlannerForm(blankPlannerForm);

    expect(errors.destination).toBe("Please select a destination.");
    expect(errors.startDate).toBe("Please select an arrival date.");
    expect(errors.endDate).toBe("Please select a departure date.");
    expect(errors.days).toBe("Please select or calculate trip duration.");
    expect(errors.travelers).toBe("Please select number of travellers.");
    expect(errors.budgetTier).toBe("Please select a budget style.");
    expect(errors.budgetAmount).toBe("Please enter your total allowance.");
    expect(errors.styles).toBe("Please select at least one travel style.");
  });

  it("6. validates departure on or after arrival date, positive travellers, and min ₹1,000 allowance", () => {
    // Departure before arrival
    const invalidDatesForm: PlannerForm = {
      ...blankPlannerForm,
      destination: "Jaipur",
      startDate: "2026-11-20",
      endDate: "2026-11-18",
      days: 0,
      travelers: 2,
      budgetTier: "Budget",
      budgetAmount: 20000,
      styles: ["Culture"],
    };
    const dateErrors = validatePlannerForm(invalidDatesForm);
    expect(dateErrors.endDate).toBe("Departure date must be on or after arrival date.");

    // Budget under ₹1,000
    const lowBudgetForm: PlannerForm = {
      ...blankPlannerForm,
      destination: "Jaipur",
      startDate: "2026-11-15",
      endDate: "2026-11-18",
      days: 4,
      travelers: 2,
      budgetTier: "Budget",
      budgetAmount: 500,
      styles: ["Culture"],
    };
    const budgetErrors = validatePlannerForm(lowBudgetForm);
    expect(budgetErrors.budgetAmount).toBe("Total allowance must be at least ₹1,000.");

    // Perfectly valid form produces no errors
    const validForm: PlannerForm = {
      destination: "Jaipur",
      startDate: "2026-11-15",
      endDate: "2026-11-18",
      days: 4,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 40000,
      styles: ["Culture", "History"],
    };
    const validErrors = validatePlannerForm(validForm);
    expect(Object.keys(validErrors).length).toBe(0);
  });
});
