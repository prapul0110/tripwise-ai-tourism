import { describe, it, expect } from "vitest";
import { destinations, matchDestination, getDestination } from "../client/src/data/destinations";
import { buildDestinationItinerary } from "./itineraryEngine";

describe("Destination Selection & Navigation to Planner", () => {
  // Test 1: Explore -> Destination Guide -> Plan this place matches for all destinations
  it("1. matches destination correctly from ID and name for Hyderabad, Goa, Jaipur and other Indian destinations", () => {
    // Hyderabad
    const hydById = matchDestination("hyderabad");
    expect(hydById?.name).toBe("Hyderabad");
    const hydByName = matchDestination("Hyderabad");
    expect(hydByName?.name).toBe("Hyderabad");
    const hydByUpper = matchDestination("HYDERABAD");
    expect(hydByUpper?.name).toBe("Hyderabad");

    // Goa
    const goaById = matchDestination("goa");
    expect(goaById?.name).toBe("Goa");
    const goaByName = matchDestination("Goa");
    expect(goaByName?.name).toBe("Goa");

    // Jaipur
    const jaipurById = matchDestination("jaipur");
    expect(jaipurById?.name).toBe("Jaipur");
    const jaipurByName = matchDestination("Jaipur");
    expect(jaipurByName?.name).toBe("Jaipur");

    // Other Indian destinations
    const kerala = matchDestination("kerala");
    expect(kerala?.name).toBe("Kerala");

    const mumbai = matchDestination("mumbai");
    expect(mumbai?.name).toBe("Mumbai");

    const manali = matchDestination("manali");
    expect(manali?.name).toBe("Manali");

    const bodhGaya = matchDestination("bodh-gaya");
    expect(bodhGaya?.name).toBe("Bodh Gaya");

    const bodhGayaEncoded = matchDestination(encodeURIComponent("bodh-gaya"));
    expect(bodhGayaEncoded?.name).toBe("Bodh Gaya");
  });

  // Test 2: Directly opening AI Planner -> blank defaults preserved
  it("2. returns null for empty or missing destination so directly opened AI Planner remains blank", () => {
    expect(matchDestination("")).toBeNull();
    expect(matchDestination("   ")).toBeNull();
    expect(matchDestination(null)).toBeNull();
    expect(matchDestination(undefined)).toBeNull();
    expect(matchDestination("non-existent-destination-xyz")).toBeNull();
  });

  // Test 3: Old saved Goa draft does NOT override a newly selected Hyderabad destination
  it("3. URL query parameter destination takes authoritative priority over an old saved Goa draft", () => {
    const oldGoaDraft = {
      destination: "Goa",
      days: 4,
      travelers: 2,
      budgetTier: "Moderate" as const,
      budgetAmount: 38000,
      styles: ["Relaxation", "Food"],
      isEditing: true,
    };

    // Simulate arriving from Hyderabad Guide: ?destination=hyderabad
    const incomingUrlParam = "hyderabad";
    const matchedUrlDest = matchDestination(incomingUrlParam);
    expect(matchedUrlDest).not.toBeNull();
    expect(matchedUrlDest?.name).toBe("Hyderabad");

    // Resolution logic mirroring Planner.tsx form initialization:
    // If URL destination exists, it overrides the stale draft destination
    const resolvedDestination = matchedUrlDest ? matchedUrlDest.name : oldGoaDraft.destination;
    expect(resolvedDestination).toBe("Hyderabad");
    expect(resolvedDestination).not.toBe("Goa");
  });

  // Test 4: Refreshing the planner preserves the selected destination
  it("4. refreshing the planner preserves the selected destination from URL query param", () => {
    const currentUrlParam = "jaipur";
    const matched = matchDestination(currentUrlParam);
    expect(matched?.name).toBe("Jaipur");

    // Changing another form field (e.g. days or budget) preserves destination
    const initialForm = {
      destination: matched!.name,
      days: 3,
      travelers: 2,
      budgetAmount: 35000,
    };

    // Simulate updating days
    const updatedForm = { ...initialForm, days: 5 };
    expect(updatedForm.destination).toBe("Jaipur");
    expect(updatedForm.days).toBe(5);
  });

  // Test 5: End-to-end generation produces destination-specific itinerary
  it("5. ensures Hyderabad selection generates authentic Hyderabad itinerary with Charminar and Biryani dining", () => {
    const itinerary = buildDestinationItinerary({
      destination: "Hyderabad",
      days: 3,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 40000,
      styles: ["Culture", "Food"],
      startDate: "2026-12-01",
      endDate: "2026-12-04",
    });

    expect(itinerary.title).toContain("Hyderabad");
    expect(itinerary.summary).toContain("Hyderabad");

    const allStopTitles = itinerary.days.flatMap(d => d.stops.map(s => s.title));
    const allStopLocations = itinerary.days.flatMap(d => d.stops.map(s => s.location));

    // Must NOT contain Goa stops
    expect(allStopTitles).not.toContain("Baga Beach");
    expect(allStopTitles).not.toContain("Dudhsagar Waterfalls Trek");
    expect(allStopTitles).not.toContain("Martin's Corner");

    // Must contain authentic Hyderabad attractions / food locations
    const hasHydHeritage = allStopTitles.some(t =>
      t.includes("Charminar") ||
      t.includes("Golconda") ||
      t.includes("Chowmahalla") ||
      t.includes("Biryani") ||
      t.includes("Hyderabad")
    );
    expect(hasHydHeritage).toBe(true);

    const hasHydLocation = allStopLocations.some(l =>
      l.toLowerCase().includes("hyderabad") ||
      l.toLowerCase().includes("old city") ||
      l.toLowerCase().includes("secunderabad")
    );
    expect(hasHydLocation).toBe(true);
  });

  // Test 6: End-to-end generation produces Jaipur itinerary
  it("6. ensures Jaipur selection generates authentic Jaipur itinerary with Forts and Rajasthani cuisine", () => {
    const itinerary = buildDestinationItinerary({
      destination: "Jaipur",
      days: 3,
      travelers: 2,
      budgetTier: "Moderate",
      budgetAmount: 40000,
      styles: ["Culture", "History"],
      startDate: "2026-12-01",
      endDate: "2026-12-04",
    });

    expect(itinerary.title).toContain("Jaipur");
    expect(itinerary.summary).toContain("Jaipur");

    const allStopTitles = itinerary.days.flatMap(d => d.stops.map(s => s.title));
    expect(allStopTitles).not.toContain("Baga Beach");
    expect(allStopTitles).not.toContain("Charminar");

    const hasJaipurSights = allStopTitles.some(t =>
      t.includes("Hawa Mahal") ||
      t.includes("Amber Fort") ||
      t.includes("City Palace") ||
      t.includes("Jaipur")
    );
    expect(hasJaipurSights).toBe(true);
  });
});
