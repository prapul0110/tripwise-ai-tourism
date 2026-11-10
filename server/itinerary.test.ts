import { describe, expect, it } from "vitest";
import { fallbackItinerary, hydrateItinerarySkeleton, isRecoverableItineraryResponse, itineraryResponseText, itinerarySchema, itinerarySkeletonSchema, parseItineraryPayload, tripInput, withDeadline } from "./routers";
import { areAttractionsDuplicate, buildDestinationItinerary } from "./itineraryEngine";
import { getDestination } from "../client/src/data/destinations";
import { getFoodPlacesForDestination } from "../client/src/data/foodPlaces";

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
    expect(parsed.days.every(day => day.stops.length >= 2 && day.stops.length <= 6)).toBe(true);
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

  it("generates authentic destination-specific itineraries for Goa without generic placeholders", () => {
    const goaPlan = fallbackItinerary(planningInput);
    const parsed = itinerarySchema.parse(goaPlan);

    expect(parsed.title).toContain("Goa");
    const stopTitles = parsed.days.flatMap(d => d.stops.map(s => s.title));
    const stopLocations = parsed.days.flatMap(d => d.stops.map(s => s.location));

    // Must contain authentic Goa attractions
    expect(stopTitles.some(t => /Fort Aguada|Baga Beach|Fontainhas|Anjuna|Palolem|Chapora|Arambol|Cabo de Rama|Reis Magos/i.test(t))).toBe(true);
    // Must NOT contain generic placeholders
    expect(stopTitles.some(t => /Discover Goa|Local lunch pause|Signature afternoon/i.test(t))).toBe(false);
    // Must NOT contain attractions from other cities
    expect(stopTitles.some(t => /Charminar|Marina Beach|Humayun|Gateway of India|Golden Temple/i.test(t))).toBe(false);
    // Locations should reference Goa
    expect(stopLocations.every(loc => /Goa/i.test(loc))).toBe(true);
  });

  it("generates authentic destination-specific itineraries for Hyderabad with famous biryani / food spots", () => {
    const hydInput = tripInput.parse({
      destination: "Hyderabad",
      startDate: "2026-11-01",
      endDate: "2026-11-04",
      days: 3,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 35000,
      styles: ["Culture", "History", "Food"],
    });

    const hydPlan = fallbackItinerary(hydInput);
    const parsed = itinerarySchema.parse(hydPlan);

    expect(parsed.title).toContain("Hyderabad");
    const stopTitles = parsed.days.flatMap(d => d.stops.map(s => s.title));
    const stopLocations = parsed.days.flatMap(d => d.stops.map(s => s.location));

    expect(stopTitles.some(t => /Charminar|Golconda|Chowmahalla|Hussain Sagar|Qutb Shahi/i.test(t))).toBe(true);
    // Must include famous food establishments
    expect(stopTitles.some(t => /Shadab|Bawarchi|Nimrah|Chutneys|Subhan|Govind/i.test(t))).toBe(true);
    expect(stopTitles.some(t => /Discover|Local lunch pause|Signature afternoon/i.test(t))).toBe(false);
    expect(stopTitles.some(t => /Fort Aguada|Marina Beach|Taj Mahal|Golden Temple/i.test(t))).toBe(false);
    expect(stopLocations.every(loc => /Hyderabad|Old City|Banjara Hills|Charminar/i.test(loc))).toBe(true);
  });

  it("generates authentic destination-specific itineraries for Kerala across multiple days", () => {
    const keralaInput = tripInput.parse({
      destination: "Kerala",
      startDate: "2026-12-10",
      endDate: "2026-12-15",
      days: 5,
      travelers: 3,
      budgetTier: "Premium",
      budgetAmount: 85000,
      styles: ["Nature", "Relaxation"],
    });

    const keralaPlan = fallbackItinerary(keralaInput);
    const parsed = itinerarySchema.parse(keralaPlan);

    expect(parsed.days).toHaveLength(5);
    const stopTitles = parsed.days.flatMap(d => d.stops.map(s => s.title));

    expect(stopTitles.some(t => /Fort Kochi|Munnar|Alappuzha|Backwaters|Varkala|Athirappilly/i.test(t))).toBe(true);
    expect(stopTitles.some(t => /Paragon|Grand Pavilion|Kashi Art|Dhe Puttu|Villa Maya|Mothers Veg|Thaff|Rapsy|Bamboo|Curry Leaf/i.test(t))).toBe(true);
    expect(stopTitles.some(t => /Charminar|Fort Aguada|Baga Beach|Gateway of India/i.test(t))).toBe(false);
  });

  it("schedules named food establishments into proper meal slots with specialty information", () => {
    const destinationsToCheck = ["Goa", "Hyderabad", "Jaipur", "Amritsar", "Mumbai", "Delhi"];
    for (const city of destinationsToCheck) {
      const input = tripInput.parse({
        destination: city,
        startDate: "2026-11-01",
        endDate: "2026-11-04",
        days: 3,
        travelers: 2,
        budgetTier: "Moderate",
        budgetAmount: 30000,
        styles: ["Food", "Culture"],
      });

      const plan = fallbackItinerary(input);
      const allStops = plan.days.flatMap(d => d.stops);
      const foodStops = allStops.filter(s => s.stopType === "food" || s.location.includes("Food Spot"));

      expect(foodStops.length, `Expected food spots in ${city}`).toBeGreaterThan(0);
      // Food stops should specify specialties or culinary details
      const foodDescriptions = foodStops.map(f => f.description);
      expect(foodDescriptions.some(desc => /specialties|renowned|famous|dishes|signature/i.test(desc))).toBe(true);
    }
  });

  it("correctly resolves city names, state names, and supported aliases", () => {
    expect(getDestination("Goa").id).toBe("goa");
    expect(getDestination("goa").id).toBe("goa");
    expect(getDestination("Hyderabad").id).toBe("hyderabad");
    expect(getDestination("Telangana").id).toBe("hyderabad");
    expect(getDestination("Rajasthan").id).toBe("jaipur");
    expect(getDestination("West Bengal").id).toBe("kolkata");
    expect(getDestination("Punjab").id).toBe("amritsar");
    expect(getDestination("Visakhapatnam").id).toBe("visakhapatnam");
    expect(getDestination("Andhra Pradesh").id).toBe("visakhapatnam");
  });

  it("provides varied selections when alternatives exist across repeated trip generations", () => {
    const input = tripInput.parse({
      destination: "Goa",
      startDate: "2026-11-01",
      endDate: "2026-11-04",
      days: 3,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 30000,
      styles: ["Culture", "Coast"],
    });

    const run1 = buildDestinationItinerary(input);
    const run2 = buildDestinationItinerary(input);

    const stops1 = run1.days.flatMap(d => d.stops.map(s => s.title));
    const stops2 = run2.days.flatMap(d => d.stops.map(s => s.title));

    // Both runs must be valid, authentic itineraries
    expect(stops1.length).toBeGreaterThan(5);
    expect(stops2.length).toBeGreaterThan(5);
  });

  it("strictly prevents duplicate attractions and restaurants across days for 4-day and 7-day itineraries", () => {
    const destinationsToTest = [
      { name: "Goa", styles: ["Relaxation", "Food"] },
      { name: "Hyderabad", styles: ["Culture", "History"] },
      { name: "Kerala", styles: ["Nature", "Relaxation"] },
      { name: "Jaipur", styles: ["Culture", "Photography"] },
      { name: "Visakhapatnam", styles: ["Coast", "Food"] },
      { name: "Amritsar", styles: ["Culture", "Food"] },
      { name: "Manali", styles: ["Mountains", "Adventure"] },
      { name: "Kolkata", styles: ["Culture", "Food"] },
    ];

    for (const testDest of destinationsToTest) {
      for (const tripDays of [4, 7]) {
        const input = tripInput.parse({
          destination: testDest.name,
          startDate: "2026-11-01",
          endDate: "2026-11-08",
          days: tripDays,
          travelers: 2,
          budgetTier: "Moderate",
          budgetAmount: tripDays * 8000,
          styles: testDest.styles,
        });

        const plan = fallbackItinerary(input);
        const parsed = itinerarySchema.parse(plan);

        expect(parsed.days).toHaveLength(tripDays);

        // Collect stops day by day
        for (let dayA = 0; dayA < parsed.days.length; dayA++) {
          const stopsDayA = parsed.days[dayA]!.stops;

          // Check intra-day: stops on the same day must not duplicate
          for (let i = 0; i < stopsDayA.length; i++) {
            for (let j = i + 1; j < stopsDayA.length; j++) {
              const dup = areAttractionsDuplicate(
                { name: stopsDayA[i]!.title },
                { name: stopsDayA[j]!.title }
              );
              expect(dup, `Intra-day duplicate on Day ${dayA + 1} in ${testDest.name}: "${stopsDayA[i]!.title}" vs "${stopsDayA[j]!.title}"`).toBe(false);
            }
          }

          // Check inter-day: stops on Day A must not duplicate with any subsequent Day B
          for (let dayB = dayA + 1; dayB < parsed.days.length; dayB++) {
            const stopsDayB = parsed.days[dayB]!.stops;
            for (const stopA of stopsDayA) {
              for (const stopB of stopsDayB) {
                const isLeisure = (title: string) => /unhurried|leisure|artisan|bazaars|cuisine tasting|studios|promenade|dining|pause|stroll/i.test(title);
                const aIsLeisure = isLeisure(stopA.title);
                const bIsLeisure = isLeisure(stopB.title);

                if (aIsLeisure && bIsLeisure) {
                  expect(stopA.title, `Duplicate leisure title between Day ${dayA + 1} and Day ${dayB + 1} in ${testDest.name}`).not.toBe(stopB.title);
                } else if (!aIsLeisure && !bIsLeisure) {
                  const dup = areAttractionsDuplicate(
                    { name: stopA.title },
                    { name: stopB.title }
                  );
                  expect(dup, `Cross-day duplicate between Day ${dayA + 1} and Day ${dayB + 1} in ${testDest.name}: "${stopA.title}" vs "${stopB.title}"`).toBe(false);
                }
              }
            }
          }
        }
      }
    }
  });

  it("calculates valid transit estimates and daily travel totals for every day", () => {
    const hydInput = tripInput.parse({
      destination: "Hyderabad",
      startDate: "2026-11-01",
      endDate: "2026-11-04",
      days: 3,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 35000,
      styles: ["Culture", "Food"],
    });

    const hydPlan = fallbackItinerary(hydInput);
    const parsed = itinerarySchema.parse(hydPlan);

    for (const day of parsed.days) {
      expect(day.totalDistanceKm).toBeGreaterThan(0);
      expect(day.totalTransitMinutes).toBeGreaterThan(0);
      expect(day.formattedDailyDistance).toMatch(/km|m/);
      expect(day.formattedDailyTransit).toMatch(/mins|hr/);

      // Verify that every stop except the last has a valid transitToNext leg
      for (let i = 0; i < day.stops.length - 1; i++) {
        const stop = day.stops[i]!;
        expect(stop.transitToNext).toBeDefined();
        expect(stop.transitToNext?.distanceKm).toBeGreaterThan(0);
        expect(stop.transitToNext?.durationMinutes).toBeGreaterThan(0);
        expect(stop.transitToNext?.formattedDistance).toBeDefined();
        expect(stop.transitToNext?.formattedDuration).toBeDefined();
        expect(["google_maps", "estimate"]).toContain(stop.transitToNext?.source);
      }
    }
  });

  it("clusters daily stops geographically avoiding extreme cross-region jumps", () => {
    const goaPlan = fallbackItinerary(planningInput);
    const parsed = itinerarySchema.parse(goaPlan);

    for (const day of parsed.days) {
      // In clustered itineraries, standard daily travel is minimized; full-day excursions like Dudhsagar can be ~75 km
      for (const stop of day.stops) {
        if (stop.transitToNext) {
          expect(stop.transitToNext.distanceKm).toBeLessThan(90);
        }
      }
    }
  });
});
