import { describe, expect, it } from "vitest";
import { fallbackItinerary, hydrateItinerarySkeleton, isRecoverableItineraryResponse, itineraryResponseText, itinerarySchema, itinerarySkeletonSchema, parseItineraryPayload, tripInput, withDeadline } from "./routers";

const planningInput = tripInput.parse({
  destination: "Goa",
  startDate: "2026-10-12",
  endDate: "2026-10-15",
  days: 4,
  travelers: 2,
  budgetTier: "Moderate",
  budgetAmount: 40000,
  styles: ["Relaxation", "Food"],
});

describe("TripWise itinerary shaping", () => {
  it("creates a complete fallback itinerary matching the structured output contract", () => {
    const itinerary = fallbackItinerary(planningInput);
    const parsed = itinerarySchema.parse(itinerary);

    expect(parsed.days).toHaveLength(4);
    expect(parsed.days.map(day => day.day)).toEqual([1, 2, 3, 4]);
    expect(parsed.days.every(day => day.stops.length === 3)).toBe(true);
    expect(parsed.days.flatMap(day => day.stops).reduce((sum, stop) => sum + stop.estimatedCost, 0)).toBeGreaterThan(0);
  });

  it("rejects malformed trip requests before requesting an AI itinerary", () => {
    expect(() => tripInput.parse({ ...planningInput, days: 31 })).toThrow();
    expect(() => tripInput.parse({ ...planningInput, styles: [] })).toThrow();
  });

  it("accepts string and multipart model content before parsing structured output", () => {
    expect(itineraryResponseText('{"title":"Goa"}')).toBe('{"title":"Goa"}');
    expect(itineraryResponseText([{ type: "text", text: "```json\n{\"title\":\"Goa\"}\n```" }])).toBe('{"title":"Goa"}');
  });

  it("accepts compact human-readable itinerary time labels", () => {
    const itinerary = fallbackItinerary(planningInput);
    itinerary.days[0]!.stops[0]!.time = "Morning · around 09:00 after breakfast";
    expect(itinerarySchema.parse(itinerary).days[0]?.stops[0]?.time).toContain("Morning");
  });

  it("rejects incomplete and truncated model payloads so generation can retry safely", () => {
    expect(parseItineraryPayload(planningInput, JSON.stringify(fallbackItinerary(planningInput)))).toBeTruthy();
    expect(() => parseItineraryPayload(planningInput, JSON.stringify({ ...fallbackItinerary(planningInput), days: [] }))).toThrow();
    expect(() => parseItineraryPayload(planningInput, "{\"title\":")).toThrow();
  });

  it("treats empty, malformed, and incomplete model responses as retryable", () => {
    let emptyContentError: unknown;
    try { itineraryResponseText(""); } catch (error) { emptyContentError = error; }
    expect(emptyContentError).toBeInstanceOf(Error);
    expect(isRecoverableItineraryResponse(emptyContentError)).toBe(true);
    expect(isRecoverableItineraryResponse(new SyntaxError("Truncated JSON"))).toBe(true);
    expect(isRecoverableItineraryResponse(new Error("The itinerary model returned an incomplete daily plan."))).toBe(true);
    expect(isRecoverableItineraryResponse(new Error("The itinerary service took too long to respond."))).toBe(false);
  });

  it("hydrates a compact AI itinerary skeleton into complete day and stop content", () => {
    const skeleton = itinerarySkeletonSchema.parse({
      title: "Goa by the coast",
      summary: "A balanced four-day coastal route with relaxed food stops and easy beach exploration.",
      days: Array.from({ length: 4 }, (_, index) => ({ day: index + 1, theme: "Coastal calm", anchor: "Fontainhas" })),
    });
    const hydrated = hydrateItinerarySkeleton(planningInput, skeleton);
    expect(hydrated.days).toHaveLength(4);
    expect(hydrated.days.every(day => day.stops.length === 2)).toBe(true);
  });

  it("fails over promptly when an itinerary operation exceeds its deadline", async () => {
    await expect(withDeadline(new Promise(resolve => setTimeout(resolve, 30)), 1, "Timed out")).rejects.toThrow("Timed out");
  });
});
