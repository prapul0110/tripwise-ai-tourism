import { describe, expect, it } from "vitest";
import { adjustPlannerDates, blankPlannerForm, computeDuration, validatePlannerForm } from "../client/src/lib/plannerHelpers";

describe("Planner Date Handling & Auto-Adjustment", () => {
  it("computes duration accurately for normal date ranges", () => {
    // Oct 12 to Oct 15 is 4 days (12, 13, 14, 15)
    expect(computeDuration("2026-10-12", "2026-10-15")).toBe(4);
    // Oct 12 to Oct 13 is 2 days
    expect(computeDuration("2026-10-12", "2026-10-13")).toBe(2);
  });

  it("handles normal date updates without altering departure when arrival is before departure", () => {
    const result = adjustPlannerDates("2026-10-15", "2026-10-20", "startDate", "2026-10-10");
    expect(result.startDate).toBe("2026-10-10");
    expect(result.endDate).toBe("2026-10-20"); // preserved
    expect(result.days).toBe(11);
  });

  it("automatically bumps departure to arrival + 1 day when arrival is set to the same day as departure", () => {
    // Current departure is 2026-10-15. User sets arrival to 2026-10-15 (same day).
    const result = adjustPlannerDates("2026-10-10", "2026-10-15", "startDate", "2026-10-15");
    expect(result.startDate).toBe("2026-10-15");
    expect(result.endDate).toBe("2026-10-16"); // arrival + 1 day
    expect(result.days).toBe(2);
  });

  it("automatically bumps departure to arrival + 1 day when arrival is set AFTER current departure", () => {
    // Current departure is 2026-10-15. User moves arrival to 2026-10-20.
    const result = adjustPlannerDates("2026-10-10", "2026-10-15", "startDate", "2026-10-20");
    expect(result.startDate).toBe("2026-10-20");
    expect(result.endDate).toBe("2026-10-21"); // arrival + 1 day
    expect(result.days).toBe(2);
  });

  it("preserves blank initial state when only arrival date is selected", () => {
    const result = adjustPlannerDates("", "", "startDate", "2026-10-12");
    expect(result.startDate).toBe("2026-10-12");
    expect(result.endDate).toBe(""); // remains blank until chosen
    expect(result.days).toBe(0);
  });

  it("preserves blank initial state when only departure date is selected", () => {
    const result = adjustPlannerDates("", "", "endDate", "2026-10-18");
    expect(result.startDate).toBe("");
    expect(result.endDate).toBe("2026-10-18");
    expect(result.days).toBe(0);
  });

  it("prevents zero-day trips when arrival and departure dates are present", () => {
    // After automatic adjustment, departure is always > arrival, preventing 0 days
    const result = adjustPlannerDates("", "2026-10-15", "startDate", "2026-10-18");
    expect(result.days).toBeGreaterThanOrEqual(1);
    expect(result.days).toBe(2);
  });

  it("validates that blank dates fail submission validation", () => {
    const errors = validatePlannerForm({
      ...blankPlannerForm,
      destination: "Goa",
    });
    expect(errors.startDate).toBe("Please select an arrival date.");
    expect(errors.endDate).toBe("Please select a departure date.");
    expect(errors.days).toBe("Please select or calculate trip duration.");
  });
});
