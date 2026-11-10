import { describe, it, expect } from "vitest";
import { fallbackItinerary, tripInput, itinerarySchema } from "./routers";

describe("Geographic Route Optimization & Transit Verification", () => {
  const destinations = [
    { name: "Goa", days: 4, styles: ["Relaxation", "Food"] },
    { name: "Hyderabad", days: 3, styles: ["Culture", "Food"] },
    { name: "Kerala", days: 4, styles: ["Nature", "Relaxation"] },
    { name: "Jaipur", days: 3, styles: ["History", "Culture"] }
  ];

  for (const d of destinations) {
    it(`generates clustered routes and valid transit legs for ${d.name}`, () => {
      const input = tripInput.parse({
        destination: d.name,
        startDate: "2026-11-15",
        endDate: "2026-11-19",
        days: d.days,
        travelers: 2,
        budgetTier: "Moderate",
        budgetAmount: 45000,
        styles: d.styles,
      });

      const plan = fallbackItinerary(input);
      const parsed = itinerarySchema.parse(plan);

      console.log(`\n================== ${d.name.toUpperCase()} (${d.days} DAYS) ==================`);
      console.log(`Title: ${parsed.title}`);

      expect(parsed.days).toHaveLength(d.days);

      for (const day of parsed.days) {
        console.log(`\n[DAY ${day.day} - ${day.theme}]`);
        console.log(`  Daily travel total: ${day.formattedDailyDistance} · ${day.formattedDailyTransit}`);
        expect(day.totalDistanceKm).toBeGreaterThan(0);
        expect(day.totalTransitMinutes).toBeGreaterThan(0);

        for (let i = 0; i < day.stops.length; i++) {
          const stop = day.stops[i]!;
          const badge = stop.stopType === "food" ? "🍴 [FOOD]" : "📍 [SIGHT]";
          console.log(`    ${badge} ${stop.time} - ${stop.title}`);
          console.log(`       Location: ${stop.location} | Duration: ${stop.duration}`);
          if (stop.specialties) console.log(`       Specialties: ${stop.specialties.join(", ")}`);

          if (stop.transitToNext) {
            console.log(`       ==> Transit: ${stop.transitToNext.formattedDuration} · ${stop.transitToNext.formattedDistance} (${stop.transitToNext.source})`);
            expect(stop.transitToNext.distanceKm).toBeGreaterThan(0);
            expect(stop.transitToNext.durationMinutes).toBeGreaterThan(0);
          }
        }
      }
    });
  }
});
