import { describe, it, expect } from "vitest";
import { destinations } from "../client/src/data/destinations";
import { getFoodPlacesForDestination } from "../client/src/data/foodPlaces";
import {
  buildExploreDestinationMapUrl,
  buildSinglePlaceDirectionsUrl,
  buildItineraryDayDirectionsUrl,
} from "../client/src/lib/mapsDirections";
import type { ItineraryDay } from "../client/src/contexts/TripContext";

describe("Google Maps Directions & Explore Map Behaviour", () => {
  const goa = destinations.find(d => d.id === "goa")!;
  const goaFoods = getFoodPlacesForDestination("goa");

  // 1. Explore page Open Directions verification
  it("1. Explore -> Goa Open Directions opens centered map without waypoints, routes, or accommodation", () => {
    const exploreUrl = buildExploreDestinationMapUrl(goa.coords, goa.name);

    // Official Google Maps URL for area display
    expect(exploreUrl).toContain("google.com/maps/@");
    expect(exploreUrl).toContain("map_action=map");
    expect(exploreUrl).toContain(`center=${goa.coords.lat},${goa.coords.lng}`);
    expect(exploreUrl).toContain("zoom=11");

    // Strictly ensure no multi-stop zigzag route was constructed
    expect(exploreUrl).not.toContain("waypoints=");
    expect(exploreUrl).not.toContain("origin=");
    expect(exploreUrl).not.toContain("destination=");
    expect(exploreUrl).not.toContain("travelmode=");

    // Strictly ensure no hotel / accommodation is included
    expect(exploreUrl.toLowerCase()).not.toContain("hotel");
    expect(exploreUrl.toLowerCase()).not.toContain("resort");
  });

  // 2. Individual attraction and food-place Directions link verification
  it("2. Individual attraction Directions link opens directions to that specific location", () => {
    const fortAguada = goa.points.find(p => p.id === "aguada")!;
    expect(fortAguada).toBeDefined();

    const attractionUrl = buildSinglePlaceDirectionsUrl(fortAguada.coords);
    expect(attractionUrl).toBe(
      `https://www.google.com/maps/dir/?api=1&destination=${fortAguada.coords.lat},${fortAguada.coords.lng}`
    );
    expect(attractionUrl).not.toContain("waypoints=");
    expect(attractionUrl).not.toContain("origin=");
  });

  it("2b. Individual food-place Directions link opens directions to that specific eatery", () => {
    const martinsCorner = goaFoods.find(f => f.name.toLowerCase().includes("martin"))!;
    expect(martinsCorner).toBeDefined();

    const foodUrl = buildSinglePlaceDirectionsUrl(martinsCorner.coords);
    expect(foodUrl).toBe(
      `https://www.google.com/maps/dir/?api=1&destination=${martinsCorner.coords.lat},${martinsCorner.coords.lng}`
    );
    expect(foodUrl).not.toContain("waypoints=");
    expect(foodUrl).not.toContain("origin=");
  });

  // 3. Trip Detail Day 1 Open Directions verification
  const sampleTripDays: ItineraryDay[] = [
    {
      day: 1,
      title: "Southern Heritage & Excursion",
      stops: [
        {
          id: "d1-s1",
          title: "Dudhsagar Waterfalls Trek",
          location: "Mollem National Park",
          description: "Morning trek",
          duration: "4 hours",
          coords: { lat: 15.3144, lng: 74.3144 },
          stopType: "attraction",
        },
        {
          id: "d1-s2",
          title: "Spice Village Lunch",
          location: "Ponda",
          description: "Traditional Goan lunch",
          duration: "90 minutes",
          coords: { lat: 15.4025, lng: 74.0152 },
          stopType: "food",
          mealType: "lunch",
        },
        {
          id: "d1-s3",
          title: "Martin's Corner",
          location: "Betalbatim",
          description: "Evening dinner with coastal delicacies",
          duration: "2 hours",
          coords: { lat: 15.2982, lng: 73.9214 },
          stopType: "food",
          mealType: "dinner",
        },
      ],
    },
    {
      day: 2,
      title: "North Coast Coastal Highlights",
      stops: [
        {
          id: "d2-s1",
          title: "Infantaria Bakery & Cafe",
          location: "Calangute",
          description: "Fresh breakfast pastries",
          duration: "1 hour",
          coords: { lat: 15.5412, lng: 73.7578 },
          stopType: "food",
          mealType: "breakfast",
        },
        {
          id: "d2-s2",
          title: "Fort Aguada",
          location: "Candolim",
          description: "17th-century Portuguese fortress",
          duration: "2 hours",
          coords: { lat: 15.4922, lng: 73.7736 },
          stopType: "attraction",
        },
        {
          id: "d2-s3",
          title: "Gunpowder",
          location: "Assagao",
          description: "South Indian coastal lunch",
          duration: "90 minutes",
          coords: { lat: 15.5901, lng: 73.7789 },
          stopType: "food",
          mealType: "lunch",
        },
        {
          id: "d2-s4",
          title: "Chapora Fort",
          location: "Vagator",
          description: "Sunset coastal viewpoint",
          duration: "90 minutes",
          coords: { lat: 15.6058, lng: 73.7371 },
          stopType: "attraction",
        },
      ],
    },
  ];

  it("3. Trip Detail -> Day 1 Open Directions includes only Day 1 ordered itinerary stops", () => {
    const day1Stops = sampleTripDays[0].stops.map(s => ({ coords: s.coords!, title: s.title }));
    const day1Url = buildItineraryDayDirectionsUrl(day1Stops, goa.coords);

    // Verify it is a driving directions URL
    expect(day1Url).toContain("google.com/maps/dir/");
    expect(day1Url).toContain("travelmode=driving");

    // Origin must be Day 1's first stop (Dudhsagar Waterfalls: 15.3144, 74.3144)
    expect(day1Url).toContain("origin=15.3144,74.3144");

    // Destination must be Day 1's last stop (Martin's Corner: 15.2982, 73.9214)
    expect(day1Url).toContain("destination=15.2982,73.9214");

    // Intermediate waypoint must be Spice Village (15.4025, 74.0152)
    expect(day1Url).toContain("waypoints=15.4025,74.0152");

    // Strictly ensure Day 2 stops are NOT in Day 1 URL
    expect(day1Url).not.toContain("15.5412,73.7578"); // Infantaria
    expect(day1Url).not.toContain("15.4922,73.7736"); // Aguada
    expect(day1Url).not.toContain("15.5901,73.7789"); // Gunpowder
    expect(day1Url).not.toContain("15.6058,73.7371"); // Chapora
  });

  // 4. Changing to Day 2 produces only Day 2 stops
  it("4. Changing to Day 2 produces only Day 2 stops and keeps days strictly independent", () => {
    const day2Stops = sampleTripDays[1].stops.map(s => ({ coords: s.coords!, title: s.title }));
    const day2Url = buildItineraryDayDirectionsUrl(day2Stops, goa.coords);

    // Verify it is a driving directions URL
    expect(day2Url).toContain("google.com/maps/dir/");
    expect(day2Url).toContain("travelmode=driving");

    // Origin must be Day 2's first stop (Infantaria: 15.5412, 73.7578)
    expect(day2Url).toContain("origin=15.5412,73.7578");

    // Destination must be Day 2's last stop (Chapora: 15.6058, 73.7371)
    expect(day2Url).toContain("destination=15.6058,73.7371");

    // Waypoints must contain Fort Aguada and Gunpowder in exact order
    expect(day2Url).toContain("waypoints=15.4922,73.7736%7C15.5901,73.7789");

    // Strictly ensure Day 1 stops are NOT in Day 2 URL
    expect(day2Url).not.toContain("15.3144,74.3144"); // Dudhsagar
    expect(day2Url).not.toContain("15.4025,74.0152"); // Spice Village
    expect(day2Url).not.toContain("15.2982,73.9214"); // Martin's Corner
  });

  // 5. Accommodation inclusion rule
  it("5. Accommodation is included in directions ONLY when it is an explicit itinerary stop", () => {
    const accommodation = {
      name: "Taj Fort Aguada Resort",
      coords: { lat: 15.4950, lng: 73.7720 },
    };

    // Case A: Day without accommodation as stop -> hotel coords NOT in directions
    const regularStops = [
      { coords: { lat: 15.5553, lng: 73.7517 }, title: "Baga Beach" },
      { coords: { lat: 15.5731, lng: 73.7402 }, title: "Anjuna" },
    ];
    const regularUrl = buildItineraryDayDirectionsUrl(regularStops, goa.coords);
    expect(regularUrl).not.toContain("15.495,73.772");
    expect(regularUrl).not.toContain("15.4950,73.7720");

    // Case B: Day where accommodation is scheduled as departure/arrival stop
    const stopsWithHotel = [
      { coords: accommodation.coords, title: accommodation.name },
      { coords: { lat: 15.5553, lng: 73.7517 }, title: "Baga Beach" },
      { coords: { lat: 15.5731, lng: 73.7402 }, title: "Anjuna" },
    ];
    const urlWithHotel = buildItineraryDayDirectionsUrl(stopsWithHotel, goa.coords);
    expect(urlWithHotel).toContain("origin=15.495,73.772");
  });
});
