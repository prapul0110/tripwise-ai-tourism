export type LatLng = { lat: number; lng: number };

export type TransitInfo = {
  distanceKm: number;
  durationMinutes: number;
  formattedDistance: string;
  formattedDuration: string;
  source: "google_maps" | "estimate";
};

export type ItineraryStop = {
  id?: string;
  time: string;
  title: string;
  location: string;
  description: string;
  duration: string;
  estimatedCost: number;
  stopType?: "attraction" | "food";
  mealType?: "breakfast" | "lunch" | "dinner";
  specialties?: string[];
  coords?: LatLng;
  transitToNext?: TransitInfo;
};

export type ItineraryDay = {
  day: number;
  theme: string;
  stops: ItineraryStop[];
  totalDistanceKm?: number;
  totalTransitMinutes?: number;
  formattedDailyDistance?: string;
  formattedDailyTransit?: string;
};

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates straight-line great-circle distance between two GPS coordinates using Haversine formula.
 */
export function haversineDistanceKm(p1: LatLng, p2: LatLng): number {
  if (!p1 || !p2) return 0;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calibrated road transit estimation based on typical Indian urban and regional driving patterns.
 * - Detour winding factor: ~1.35x straight-line distance
 * - Average city/regional travel speed: ~28 km/h
 * - Minimum practical transit time between venues: 8 minutes
 */
export function estimateRoadTransit(p1: LatLng, p2: LatLng): TransitInfo {
  const straightKm = haversineDistanceKm(p1, p2);
  // Avoid 0 distance for co-located or very close venues
  const roadKm = Math.max(0.4, Math.round(straightKm * 1.35 * 10) / 10);
  const durationMinutes = Math.max(8, Math.round((roadKm / 28) * 60));

  const formattedDistance =
    roadKm < 1 ? `${Math.round(roadKm * 1000)} m (est.)` : `${roadKm.toFixed(1)} km (est.)`;

  const formattedDuration =
    durationMinutes >= 60
      ? `${Math.floor(durationMinutes / 60)} hr ${durationMinutes % 60} mins (est.)`
      : `${durationMinutes} mins (est.)`;

  return {
    distanceKm: roadKm,
    durationMinutes,
    formattedDistance,
    formattedDuration,
    source: "estimate",
  };
}

export function parseDurationMinutes(durationStr?: string): number {
  if (!durationStr) return 120;
  const str = durationStr.toLowerCase().trim();
  if (str.includes("full day")) return 420; // 7 hours
  if (str.includes("half day")) return 240; // 4 hours

  // Range match: "2–3 hours", "2-3 hours", "1-2 hours"
  const rangeMatch = str.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*(hour|hr|minute|min)/i);
  if (rangeMatch) {
    const minVal = parseFloat(rangeMatch[1]!);
    const maxVal = parseFloat(rangeMatch[2]!);
    const avg = (minVal + maxVal) / 2;
    const unit = rangeMatch[3]!.toLowerCase();
    if (unit.startsWith("hour") || unit.startsWith("hr")) {
      return Math.round(avg * 60);
    }
    return Math.round(avg);
  }

  const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)/i);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]!) * 60);
  }

  const minMatch = str.match(/(\d+)\s*(?:minute|min)/i);
  if (minMatch) {
    return parseInt(minMatch[1]!, 10);
  }

  return 120;
}

export function timeStringToMinutes(timeStr: string): number {
  const [hStr, mStr] = timeStr.trim().split(":");
  const h = parseInt(hStr || "0", 10);
  const m = parseInt(mStr || "0", 10);
  return h * 60 + m;
}

export function minutesToTimeString(minutes: number): string {
  const norm = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function generateStableStopId(dayNumber: number, title: string, index: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);
  const rand = Math.random().toString(36).substring(2, 7);
  return `stop-d${dayNumber}-${slug || "activity"}-${index}-${rand}`;
}

export function ensureStopId(stop: ItineraryStop, dayNumber: number, index: number): ItineraryStop {
  if (stop.id && stop.id.trim().length > 0) return stop;
  return {
    ...stop,
    id: generateStableStopId(dayNumber, stop.title, index),
  };
}

/**
 * Single reliable helper to determine a stop's meal type ("breakfast" | "lunch" | "dinner" | null).
 * Evaluates explicit `mealType` first, followed by clear duration/title descriptors,
 * and finally time-based boundaries for unlabelled food stops.
 * Never guesses meal type from arbitrary stop array indices.
 */
export function getStopMealType(stop: ItineraryStop): "breakfast" | "lunch" | "dinner" | null {
  const durationLower = (stop.duration || "").toLowerCase();
  const titleLower = (stop.title || "").toLowerCase();
  const descLower = (stop.description || "").toLowerCase();

  // If explicit mealType is set, verify consistency with explicit metadata
  if (stop.mealType === "breakfast" || stop.mealType === "lunch" || stop.mealType === "dinner") {
    // If explicit duration unequivocally specifies a different meal type (e.g. "· Dinner"), correct accidental inheritance
    if ((durationLower.includes("· dinner") || durationLower.includes("dinner spot")) && stop.mealType !== "dinner") {
      return "dinner";
    }
    if ((durationLower.includes("· breakfast") || durationLower.includes("breakfast & café")) && stop.mealType !== "breakfast") {
      return "breakfast";
    }
    if ((durationLower.includes("· lunch") || durationLower.includes("lunch spot")) && stop.mealType !== "lunch") {
      return "lunch";
    }
    return stop.mealType;
  }

  if (durationLower.includes("dinner") || titleLower.includes("dinner") || descLower.includes("dinner")) {
    return "dinner";
  }
  if (durationLower.includes("breakfast") || titleLower.includes("breakfast") || descLower.includes("breakfast")) {
    return "breakfast";
  }
  if (durationLower.includes("lunch") || titleLower.includes("lunch") || descLower.includes("lunch")) {
    return "lunch";
  }

  const isFood =
    stop.stopType === "food" ||
    (stop as any).type === "food" ||
    stop.location?.toLowerCase().includes("food spot") ||
    stop.location?.toLowerCase().includes("dining") ||
    stop.location?.toLowerCase().includes("café") ||
    stop.location?.toLowerCase().includes("bakery") ||
    stop.location?.toLowerCase().includes("restaurant");

  if (isFood) {
    const timeMins = timeStringToMinutes(stop.time || "12:00");
    if (timeMins <= timeStringToMinutes("10:30")) return "breakfast";
    if (timeMins >= timeStringToMinutes("17:30")) return "dinner";
    return "lunch";
  }

  return null;
}

/**
 * Pure recalculation function for a day's stops after manual reordering or removal.
 * Preserves user's exact sequence, updates transit legs, computes arrival times sequentially,
 * and updates daily distance / transit totals.
 */
export function recalculateDaySchedule(day: ItineraryDay): ItineraryDay {
  const rawStops = [...day.stops];

  if (rawStops.length === 0) {
    return {
      ...day,
      stops: [],
      totalDistanceKm: 0,
      totalTransitMinutes: 0,
      formattedDailyDistance: "0 km",
      formattedDailyTransit: "0 mins",
    };
  }

  // Ensure all stops have stable unique IDs
  const stops = rawStops.map((s, idx) => ensureStopId({ ...s }, day.day, idx));

  if (stops.length === 1) {
    const singleStop = { ...stops[0]! };
    const firstMeal = getStopMealType(singleStop);
    if (firstMeal) {
      singleStop.mealType = firstMeal;
      singleStop.stopType = "food";
    }
    const isFullDay = singleStop.duration.toLowerCase().includes("full day");
    singleStop.time = isFullDay ? "08:30" : firstMeal === "breakfast" ? "08:00" : firstMeal === "dinner" ? "19:00" : "09:30";
    delete singleStop.transitToNext;
    delete (singleStop as any).transitFromPrev;

    return {
      ...day,
      stops: [singleStop],
      totalDistanceKm: 0,
      totalTransitMinutes: 0,
      formattedDailyDistance: "0 km",
      formattedDailyTransit: "0 mins",
    };
  }

  // Two or more stops: sequential recalculation
  const firstMeal = getStopMealType(stops[0]!);
  if (firstMeal) {
    stops[0]!.mealType = firstMeal;
    stops[0]!.stopType = "food";
  }
  const isFirstFullDay = stops[0]!.duration.toLowerCase().includes("full day");
  const isFirstBreakfast = firstMeal === "breakfast";

  stops[0] = {
    ...stops[0]!,
    time: isFirstFullDay ? "08:30" : isFirstBreakfast ? "08:00" : "09:30",
  };
  delete (stops[0] as any).transitFromPrev;

  let totalDistKm = 0;
  let totalTransitMins = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const current = stops[i]!;
    const next = { ...stops[i + 1]! };

    // Calculate transit from current to next
    let transit: TransitInfo;
    const currentCoords = current.coords || (current as any).coordinates;
    const nextCoords = next.coords || (next as any).coordinates;

    if (
      currentCoords &&
      nextCoords &&
      (currentCoords.lat !== 0 || currentCoords.lng !== 0) &&
      (nextCoords.lat !== 0 || nextCoords.lng !== 0)
    ) {
      transit = estimateRoadTransit(currentCoords, nextCoords);
    } else {
      transit = {
        distanceKm: 0.4,
        durationMinutes: 8,
        formattedDistance: "400 m (est.)",
        formattedDuration: "8 mins (est.)",
        source: "estimate",
      };
    }

    stops[i] = {
      ...current,
      transitToNext: transit,
    };

    totalDistKm += transit.distanceKm;
    totalTransitMins += transit.durationMinutes;

    // Sequential timing calculation:
    // departure = current arrival + current duration
    const currentStartMins = timeStringToMinutes(stops[i]!.time);
    const currentDurationMins = parseDurationMinutes(stops[i]!.duration);
    const departureMins = currentStartMins + currentDurationMins;

    // minArrival = departure + transit + 10 min buffer
    const minArrivalMins = departureMins + transit.durationMinutes + 10;

    // Determine natural slot start based on mealType, stop type and position
    // For a food stop following a full-day excursion, it is authoritatively the evening dinner slot
    if (isFirstFullDay && i === 0 && (next.stopType === "food" || (next as any).type === "food" || getStopMealType(next) !== null)) {
      next.mealType = "dinner";
      next.stopType = "food";
      if (!next.duration || /breakfast|lunch/i.test(next.duration)) {
        next.duration = "90 minutes · Dinner";
      }
    } else {
      const nextMealType = getStopMealType(next);
      if (nextMealType) {
        next.mealType = nextMealType;
        next.stopType = "food";
      }
    }

    const isDinner = next.mealType === "dinner";
    const isLunch = next.mealType === "lunch";
    const isBreakfast = next.mealType === "breakfast";

    let naturalSlotMins = minArrivalMins;
    if (isDinner) {
      naturalSlotMins = timeStringToMinutes("19:00");
    } else if (isLunch) {
      naturalSlotMins = timeStringToMinutes("12:15");
    } else if (isBreakfast) {
      naturalSlotMins = timeStringToMinutes("08:00");
    } else if (next.stopType === "attraction" || (next as any).type === "attraction") {
      if (current.mealType === "breakfast" || current.title.toLowerCase().includes("breakfast")) {
        naturalSlotMins = timeStringToMinutes("09:30");
      } else if (current.mealType === "lunch" || current.title.toLowerCase().includes("lunch")) {
        naturalSlotMins = timeStringToMinutes("15:00");
      } else if (i === 0 && stops[0]?.mealType !== "breakfast") {
        naturalSlotMins = timeStringToMinutes("12:15");
      } else {
        naturalSlotMins = timeStringToMinutes("15:00");
      }
    } else if (i >= 1) {
      naturalSlotMins = timeStringToMinutes("15:00");
    }

    const scheduledArrivalMins = Math.max(naturalSlotMins, Math.ceil(minArrivalMins / 5) * 5);
    next.time = minutesToTimeString(scheduledArrivalMins);
    (next as any).transitFromPrev = transit;
    stops[i + 1] = next;
  }

  // Clear transit on the final stop
  const lastIdx = stops.length - 1;
  const lastStop = { ...stops[lastIdx]! };
  delete lastStop.transitToNext;
  stops[lastIdx] = lastStop;

  const roundedTotalDist = Math.round(totalDistKm * 10) / 10;
  const formattedDailyDistance =
    roundedTotalDist < 1 ? `${Math.round(roundedTotalDist * 1000)} m` : `~${roundedTotalDist.toFixed(1)} km`;
  const formattedDailyTransit =
    totalTransitMins >= 60
      ? `${Math.floor(totalTransitMins / 60)} hr ${totalTransitMins % 60} mins`
      : `~${totalTransitMins} mins`;

  return {
    ...day,
    stops,
    totalDistanceKm: roundedTotalDist,
    totalTransitMinutes: totalTransitMins,
    formattedDailyDistance,
    formattedDailyTransit,
  };
}
