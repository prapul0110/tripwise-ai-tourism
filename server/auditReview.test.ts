import { describe, expect, it } from 'vitest';
import { buildDestinationItinerary, parseDurationMinutes, timeStringToMinutes, areAttractionsDuplicate } from './itineraryEngine';
import { tripInput } from './routers';
import { haversineDistanceKm } from './routeOptimization';

describe('Smart Route Optimization Audit', () => {
  const testCases = [
    { destination: 'Goa', days: 4, styles: ['Relaxation', 'Food'] },
    { destination: 'Hyderabad', days: 3, styles: ['Culture', 'Food'] },
    { destination: 'Jaipur', days: 3, styles: ['History', 'Culture'] },
    { destination: 'Kerala', days: 3, styles: ['Nature', 'Relaxation'] },
  ];

  for (const tc of testCases) {
    it(`audits route quality and scheduling for ${tc.destination}`, () => {
      const input = tripInput.parse({
        destination: tc.destination,
        startDate: '2026-11-20',
        endDate: '2026-11-24',
        days: tc.days,
        travelers: 2,
        budgetTier: 'Moderate',
        budgetAmount: 40000,
        styles: tc.styles,
      });

      const plan = buildDestinationItinerary(input);
      expect(plan.days).toHaveLength(tc.days);

      // Verify zero duplicate attractions or restaurants across the whole trip
      const allStops = plan.days.flatMap(d => d.stops);
      for (let i = 0; i < allStops.length; i++) {
        for (let j = i + 1; j < allStops.length; j++) {
          const s1 = allStops[i]!;
          const s2 = allStops[j]!;
          if (s1.stopType === 'attraction' && s2.stopType === 'attraction') {
            const isDup = areAttractionsDuplicate({ name: s1.title }, { name: s2.title });
            expect(isDup, `Duplicate attraction found: ${s1.title} vs ${s2.title}`).toBe(false);
          }
          if (s1.stopType === 'food' && s2.stopType === 'food') {
            expect(s1.title, `Duplicate food venue found: ${s1.title}`).not.toBe(s2.title);
          }
        }
      }

      for (const day of plan.days) {
        // Timeline & Dynamic Arrival Time Verification:
        for (let i = 0; i < day.stops.length - 1; i++) {
          const currentStop = day.stops[i]!;
          const nextStop = day.stops[i + 1]!;

          const currentStartMins = timeStringToMinutes(currentStop.time);
          const currentDurationMins = parseDurationMinutes(currentStop.duration);
          const transitMins = currentStop.transitToNext?.durationMinutes ?? 0;
          const nextStartMins = timeStringToMinutes(nextStop.time);

          // Next stop arrival must be >= current start + current duration + transit
          // (No impossible overlaps)
          expect(
            nextStartMins,
            `Timeline overlap on Day ${day.day}: ${currentStop.title} (${currentStop.time} + ${currentDurationMins}m + ${transitMins}m transit) overlaps with ${nextStop.title} (${nextStop.time})`
          ).toBeGreaterThanOrEqual(currentStartMins + currentDurationMins + transitMins);
        }

        // State-wide clustering verification:
        if (tc.destination.toLowerCase() === 'kerala') {
          for (const stop of day.stops) {
            if (stop.transitToNext) {
              expect(
                stop.transitToNext.distanceKm,
                `Kerala transit leg exceeds 45 km threshold: ${stop.title} -> ${stop.transitToNext.distanceKm} km`
              ).toBeLessThanOrEqual(45);
            }
          }
          expect(day.totalDistanceKm).toBeLessThanOrEqual(55);
        }
      }
    });
  }
});
