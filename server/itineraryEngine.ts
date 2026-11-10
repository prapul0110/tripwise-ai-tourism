import { getDestination, type Destination, type PointOfInterest } from "../client/src/data/destinations";
import { getFoodPlacesForDestination, type FoodPlace } from "../client/src/data/foodPlaces";
import { type TripInput, itinerarySchema } from "./routers";
import { estimateRoadTransit, haversineDistanceKm, type TransitInfo } from "./routeOptimization";

export type CandidateAttraction = {
  id?: string;
  name: string;
  category: PointOfInterest["category"];
  area: string;
  description: string;
  duration: string;
  planningCost: number;
  tags: string[];
  coords: { lat: number; lng: number };
};

export type DestinationScope = "compact_city" | "regional" | "state_wide";

export interface DestinationScopeConfig {
  scope: DestinationScope;
  maxInterStopDistanceKm: number;
  maxDetourFoodKm: number;
}

export function getDestinationScope(destination: Destination): DestinationScopeConfig {
  const stateWideIds = new Set(["kerala", "rajasthan", "tamil-nadu", "himachal-pradesh"]);
  const regionalIds = new Set(["goa", "manali", "ladakh", "kashmir"]);

  let maxSpan = 0;
  if (destination.points && destination.points.length >= 2) {
    for (let i = 0; i < destination.points.length; i++) {
      for (let j = i + 1; j < destination.points.length; j++) {
        const d = haversineDistanceKm(destination.points[i]!.coords, destination.points[j]!.coords);
        if (d > maxSpan) maxSpan = d;
      }
    }
  }

  if (stateWideIds.has(destination.id.toLowerCase()) || maxSpan >= 140) {
    return {
      scope: "state_wide",
      maxInterStopDistanceKm: 45, // Configurable threshold for state-wide destinations
      maxDetourFoodKm: 35,
    };
  }

  if (regionalIds.has(destination.id.toLowerCase()) || maxSpan >= 50) {
    return {
      scope: "regional",
      maxInterStopDistanceKm: 60,
      maxDetourFoodKm: 40,
    };
  }

  return {
    scope: "compact_city",
    maxInterStopDistanceKm: 30,
    maxDetourFoodKm: 20,
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

import { recalculateDaySchedule, ensureStopId, getStopMealType } from "../shared/routeRecalculation";
export { recalculateDaySchedule, ensureStopId, getStopMealType };

const STOP_WORDS = new Set([
  "fort", "beach", "temple", "palace", "lake", "waterfall", "waterfalls",
  "museum", "monastery", "garden", "gardens", "park", "viewpoint",
  "sanctuary", "bazaar", "bazaars", "market", "markets", "promenade", "ashram",
  "caves", "cave", "tomb", "tombs", "citadel", "shrine", "cathedral", "basilica",
  "hill", "hills", "valley", "village", "memorial", "falls", "river", "island",
  "sea", "ocean", "bay", "port", "harbour", "harbor", "shore", "coast", "water", "waters",
  "peak", "ghat", "ghats", "ridge", "view", "pass", "dam", "bridge", "tower", "square",
  "quarter", "trail", "walk", "tour", "excursion", "express", "heritage",
  "and", "the", "for", "with", "near", "old", "new", "city", "town",
  "hall", "gate", "road", "street", "circuit", "point", "centre", "center",
  "spice", "spices", "plantation", "plantations", "artisan", "artisans",
  "handloom", "handlooms", "craft", "crafts", "studio", "studios", "dining",
  "stroll", "tasting", "pause", "experience", "discovery", "leisure", "morning",
  "afternoon", "evening", "sunset", "unhurried", "local", "traditional",
  "breakfast", "lunch", "dinner", "scenic", "panoramic", "coastal", "alpine",
  // Food establishment category nouns to avoid matching distinct venues
  "bakery", "bakeries", "cafe", "café", "caf", "restaurant", "restaurants", "dhaba", "dhabas",
  "bistro", "bistros", "eatery", "eateries", "kitchen", "kitchens", "hotel", "hotels",
  "house", "parlour", "stall", "corner", "joint", "inn", "lounge", "bar", "canteen",
  "mess", "shack", "shacks", "bhandar", "foods", "family", "food", "spot", "spots",
  "mishthan", "mishtan", "mithai", "sweet", "sweets", "tiffin", "tiffins", "bhavan", "vilas", "darshini",
  "tea", "chai", "coffee", "beverage", "drink", "drinks", "juice",
  "wale", "waley", "wala", "valey", "vala", "singh", "bhai", "shree", "sri", "sree", "grand", "royal",
  "ram", "guru", "devi", "nath", "swami", "swamy", "saint", "maharaja", "raja", "babu", "lal", "seth", "ji", "lord",
  "bagh", "mahal", "chowk", "haveli", "kund", "sarovar", "talab", "mandir", "masjid", "dargah", "gurdwara",
  // Common descriptive and generic heritage descriptors
  "art", "arts", "rock", "rocks", "prehistoric", "historic", "historical", "ancient", "national", "wildlife", "reserve",
  // Destination and State geographic names to avoid false matches across different attractions in the same city
  "goa", "hyderabad", "kerala", "jaipur", "manali", "mumbai", "delhi",
  "bengaluru", "chennai", "agra", "visakhapatnam", "tawang", "kaziranga",
  "bodh", "gaya", "jagdalpur", "ahmedabad", "gurugram", "ranchi", "khajuraho",
  "imphal", "shillong", "aizawl", "kohima", "bhubaneswar", "amritsar",
  "gangtok", "agartala", "rishikesh", "kolkata", "chandigarh", "daman",
  "srinagar", "leh", "kavaratti", "puducherry", "rajasthan", "telangana",
  "punjab", "karnataka", "maharashtra", "gujarat", "assam", "bihar",
  "odisha", "uttarakhand", "bengal", "kashmir", "ladakh", "india",
  "day", "days", "stop", "stops", "destination", "state", "amer", "amber", "ad",
]);

export function extractEntityTokens(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length >= 3 && !STOP_WORDS.has(word));
}

export function areAttractionsDuplicate(
  itemA: { id?: string; name: string },
  itemB: { id?: string; name: string }
): boolean {
  if (itemA.id && itemB.id && itemA.id === itemB.id) {
    return true;
  }
  const nameA = itemA.name.toLowerCase().trim();
  const nameB = itemB.name.toLowerCase().trim();
  if (nameA === nameB) {
    return true;
  }

  const tokensA = extractEntityTokens(nameA);
  const tokensB = extractEntityTokens(nameB);

  // If they share any distinctive entity token (e.g. 'charminar', 'aguada', 'anjuna', 'victoria', 'harmandir')
  for (const tA of tokensA) {
    if (tokensB.includes(tA)) {
      return true;
    }
  }

  return false;
}

function getDestinationAttractions(dest: Destination): CandidateAttraction[] {
  return dest.points.map(pt => ({
    id: pt.id,
    name: pt.name,
    category: pt.category,
    area: dest.name,
    description: pt.description,
    duration: pt.duration,
    planningCost: pt.planningCost,
    tags: dest.tags,
    coords: pt.coords,
  }));
}

function getLeisureStop(
  destinationName: string,
  stateName: string,
  slotType: "breakfast" | "morning" | "lunch" | "afternoon" | "evening",
  dayNumber: number,
  dailyBudget: number,
  usedTitles: Set<string>,
  fallbackCoords?: { lat: number; lng: number }
) {
  const options = {
    breakfast: [
      {
        title: `Unhurried Morning & Local Breakfast in ${destinationName}`,
        description: `Start the day at an easy pace visiting a neighbourhood café, sampling fresh local morning specials and enjoying unhurried conversations.`,
        duration: "45 minutes",
        costFraction: 0.12,
      },
      {
        title: `Heritage Bakery & Filter Coffee Pause in ${destinationName}`,
        description: `A relaxed early morning pause enjoying artisanal roasted coffee and fresh regional morning pastries.`,
        duration: "45 minutes",
        costFraction: 0.1,
      },
      {
        title: `Sunrise Herbal Tea & Garden Stroll in ${destinationName}`,
        description: `A tranquil morning outing sampling regional tea infusions paired with fresh local savouries.`,
        duration: "45 minutes",
        costFraction: 0.1,
      },
    ],
    morning: [
      {
        title: `${destinationName} Old Quarter & Architecture Stroll`,
        description: `Take a relaxed walk through quiet residential lanes, admiring traditional vernacular doorways, courtyards and local life.`,
        duration: "2 hours",
        costFraction: 0.18,
      },
      {
        title: `Riverside & Greenery Pause in ${destinationName}`,
        description: `Spend a tranquil morning amidst tree-shaded gardens or scenic waterways, enjoying the fresh morning breeze and quiet atmosphere.`,
        duration: "2 hours",
        costFraction: 0.15,
      },
      {
        title: `Neighbourhood Herbal Tea & Botanical Stroll in ${destinationName}`,
        description: `An unhurried morning stroll through community botanical gardens paired with regional herbal tea.`,
        duration: "2 hours",
        costFraction: 0.15,
      },
      {
        title: `Sunrise Stroll & Viewpoint Pause in ${destinationName}`,
        description: `A peaceful early outing observing dawn light over historic rooftops and neighbourhood shrines.`,
        duration: "90 minutes",
        costFraction: 0.12,
      },
    ],
    lunch: [
      {
        title: `${stateName} Regional Cuisine Tasting & Sweet Trail in ${destinationName}`,
        description: `Sample authentic regional snacks, traditional savouries and artisanal sweets at longstanding heritage food spots in ${destinationName}.`,
        duration: "90 minutes",
        costFraction: 0.22,
      },
      {
        title: `${destinationName} Handloom Quarter & Traditional Dining`,
        description: `Enjoy an authentic regional thali lunch in the cultural artisan precinct of ${destinationName}.`,
        duration: "90 minutes",
        costFraction: 0.2,
      },
      {
        title: `Community Spices & Traditional Lunch Pause in ${destinationName}`,
        description: `A relaxed midday lunch savoring freshly prepared local dishes in an unhurried setting.`,
        duration: "90 minutes",
        costFraction: 0.2,
      },
    ],
    afternoon: [
      {
        title: `${destinationName} Artisan Handlooms & Spice Bazaars`,
        description: `An unhurried afternoon browsing traditional craft stalls, handloom weavers and regional spice merchants native to ${stateName}.`,
        duration: "2 hours",
        costFraction: 0.2,
      },
      {
        title: `Local Craft Guilds & Independent Studios in ${destinationName}`,
        description: `Discover independent artisan studios and local craft workshops practicing generational woodworking, pottery or textile traditions.`,
        duration: "2 hours",
        costFraction: 0.18,
      },
      {
        title: `${destinationName} Literature & Antique Bazaar Browse`,
        description: `Browse second-hand book stalls, vintage brassware and local curios in the cultural market district.`,
        duration: "2 hours",
        costFraction: 0.15,
      },
    ],
    evening: [
      {
        title: `Open-Air Courtyard Dining in ${destinationName}`,
        description: `Conclude the day with a relaxed open-air dinner renowned for regional specialties, fresh local catch and chef signature dishes in an atmospheric setting.`,
        duration: "2 hours",
        costFraction: 0.25,
      },
      {
        title: `Traditional Evening Tea & Ambient Café Pause in ${destinationName}`,
        description: `Unwind at an atmospheric café or teahouse, renowned for artisanal brews, famous local savouries and regional specialties.`,
        duration: "90 minutes",
        costFraction: 0.18,
      },
      {
        title: `Dusk Lantern Stroll & Street Dining in ${destinationName}`,
        description: `Explore illuminated evening markets renowned for tasting street snacks and famous dishes prepared fresh over live coals.`,
        duration: "2 hours",
        costFraction: 0.2,
      },
      {
        title: `${destinationName} Sunset Promenade & Leisure Walk`,
        description: `A relaxed evening stroll along scenic waterfront or hill-facing viewpoints as dusk settles over ${destinationName}.`,
        duration: "90 minutes",
        costFraction: 0.15,
      },
    ],
  };

  const pool = options[slotType];
  let choice = pool.find(item => !usedTitles.has(item.title));
  if (!choice) {
    const base = pool[(dayNumber - 1) % pool.length]!;
    choice = {
      ...base,
      title: `${base.title} (Day ${dayNumber})`,
    };
  }
  usedTitles.add(choice.title);
  return {
    title: choice.title,
    location: `${destinationName}, ${stateName}`,
    description: choice.description,
    duration: choice.duration,
    estimatedCost: Math.max(100, Math.round(dailyBudget * choice.costFraction)),
    coords: fallbackCoords ?? { lat: 0, lng: 0 },
  };
}

export function buildDestinationItinerary(
  input: TripInput,
  options?: { isAiGenerated?: boolean; aiModelName?: string; seed?: number; accommodation?: any }
) {
  const destination = getDestination(input.destination);
  const attractions = getDestinationAttractions(destination);
  const foodVenues = getFoodPlacesForDestination(destination.id);
  const activeStyles = (input.styles ?? []).map((s: string) => s.toLowerCase());
  const scopeConfig = getDestinationScope(destination);
  const accommodation = options?.accommodation || (input as any).accommodation;
  const isBreakfastIncluded = Boolean(accommodation?.isBreakfastIncluded);
  const accommodationCoords = accommodation?.coords;

  // Score attractions based on user styles with slight perturbation to enable genuine variety across repeated generations
  const scored = attractions.map((attr, idx) => {
    let score = Math.max(0, (attractions.length - idx) * 0.15);
    const attrText = (attr.name + " " + attr.description + " " + attr.tags.join(" ")).toLowerCase();
    for (const style of activeStyles) {
      if (attrText.includes(style)) score += 4;
      if (attr.category.toLowerCase().includes(style)) score += 3;
    }
    // High-priority full-day / half-day excursions get natural prominence
    if (attr.duration.toLowerCase().includes("full day")) score += 2;
    // Add minor random variance to provide varied combinations when alternatives exist
    const jitter = Math.random() * 0.2;
    return { attr, score: score + jitter };
  });

  scored.sort((a, b) => b.score - a.score);
  const candidatePool = scored.map(s => s.attr);

  // Score and prepare food venues
  const foodPool = [...foodVenues];

  const daysCount = Math.max(1, input.days || 1);
  const fallbackDailyPerPerson =
    input.budgetTier === "Luxury"
      ? 15000
      : input.budgetTier === "Premium"
      ? 8000
      : input.budgetTier === "Moderate"
      ? 4500
      : 2500;
  const travelers = Math.max(1, input.travelers || 1);
  const totalBudget =
    typeof input.budgetAmount === "number" && !isNaN(input.budgetAmount) && input.budgetAmount > 0
      ? input.budgetAmount
      : fallbackDailyPerPerson * travelers * daysCount;
  const dailyBudget = Math.max(200, Math.round(totalBudget / daysCount) || 2000);

  // Global trackers across all days of the trip: STRICTLY ZERO REPEATS
  const scheduledAttractions: { id?: string; name: string }[] = [];
  const scheduledFoodVenues: Set<string> = new Set();
  const usedLeisureTitles = new Set<string>();

  const days = Array.from({ length: daysCount }, (_, dayIndex) => {
    const dayNumber = dayIndex + 1;
    let theme: string;

    if (dayNumber === 1) {
      theme = `${destination.name} Arrival & First Impressions`;
    } else if (dayNumber === daysCount) {
      theme = `A Considered Finale in ${destination.name}`;
    } else {
      const activeStyle = input.styles[(dayIndex - 1) % input.styles.length] ?? "Discovery";
      theme = `${activeStyle} & Heritage in ${destination.name}`;
    }

    const availableCandidates = candidatePool.filter(
      c => !scheduledAttractions.some(used => areAttractionsDuplicate(used, c))
    );

    // Inspect if the next available unscheduled attraction is a "Full day" excursion
    const nextUnscheduled = availableCandidates[0];
    const isFullDay = nextUnscheduled?.duration.toLowerCase().includes("full day");

    if (isFullDay && nextUnscheduled) {
      // Full day excursion day: Optional Breakfast (if not included) + Excursion + Geographically sensible Dinner
      // Respect full-day excursion: No mid-day lunch detour injected
      const attraction = nextUnscheduled;
      scheduledAttractions.push({ id: attraction.id, name: attraction.name });

      const dayStops: any[] = [];
      const anchorForExcursion = accommodationCoords || attraction.coords;

      // 1. Breakfast: If accommodation does NOT include breakfast, provide verified or authentic breakfast
      if (!isBreakfastIncluded) {
        const availableFoods = foodPool.filter(f => !scheduledFoodVenues.has(f.id));
        const breakfastCandidates = availableFoods.filter(f =>
          f.category === "Breakfast" || f.category === "Café & Bakery"
        );
        const maxBreakfastDist = scopeConfig.scope === "state_wide" ? 30 : 45;
        const eligibleBreakfast = breakfastCandidates.filter(f =>
          haversineDistanceKm(anchorForExcursion, f.coords) <= maxBreakfastDist
        );
        const breakfastVenue = [...eligibleBreakfast].sort((a, b) => {
          return haversineDistanceKm(anchorForExcursion, a.coords) - haversineDistanceKm(anchorForExcursion, b.coords);
        })[0];

        if (breakfastVenue) {
          scheduledFoodVenues.add(breakfastVenue.id);
          dayStops.push({
            time: "07:30",
            title: breakfastVenue.name,
            location: `${breakfastVenue.city.toLowerCase().includes(destination.name.toLowerCase()) ? breakfastVenue.city : `${breakfastVenue.city}, ${destination.name}`} · Breakfast & Café Spot`,
            description: `Renowned for ${breakfastVenue.famousFor}. Specialties: ${breakfastVenue.specialties.join(", ")}. ${breakfastVenue.description}`,
            duration: "45 minutes · Breakfast",
            estimatedCost: Math.max(120, Math.round(dailyBudget * 0.12)),
            stopType: "food" as const,
            mealType: "breakfast" as const,
            specialties: breakfastVenue.specialties,
            coords: breakfastVenue.coords,
          });
        } else {
          const breakfastLeisure = getLeisureStop(
            destination.name,
            destination.state,
            "breakfast",
            dayNumber,
            dailyBudget,
            usedLeisureTitles,
            anchorForExcursion
          );
          dayStops.push({
            time: "07:30",
            title: breakfastLeisure.title,
            location: breakfastLeisure.location,
            description: breakfastLeisure.description,
            duration: "45 minutes · Breakfast",
            estimatedCost: Math.max(120, Math.round(dailyBudget * 0.12)),
            stopType: "food" as const,
            mealType: "breakfast" as const,
            coords: breakfastLeisure.coords,
          });
        }
      }

      const excursionStop = {
        time: isBreakfastIncluded ? "08:30" : "08:30",
        title: attraction.name,
        location: `${attraction.area || destination.name}`,
        description: attraction.description,
        duration: attraction.duration || "Full day",
        estimatedCost: Math.max(attraction.planningCost, Math.round(dailyBudget * 0.5)),
        stopType: "attraction" as const,
        coords: attraction.coords,
      };
      dayStops.push(excursionStop);

      const availableFoods = foodPool.filter(f => !scheduledFoodVenues.has(f.id));
      const anchorForDinner = accommodationCoords || attraction.coords;
      const filteredDinnerFoods = scopeConfig.scope === "state_wide"
        ? availableFoods.filter(f => haversineDistanceKm(anchorForDinner, f.coords) <= 30)
        : availableFoods;

      const candidateFoods = filteredDinnerFoods.length > 0 ? filteredDinnerFoods : (scopeConfig.scope === "state_wide" ? [] : availableFoods);

      const dinnerVenue = [...candidateFoods].sort((a, b) => {
        const catA = a.category === "Dinner" || a.category === "Lunch" ? 0 : 5;
        const catB = b.category === "Dinner" || b.category === "Lunch" ? 0 : 5;
        const distA = haversineDistanceKm(anchorForDinner, a.coords) + catA;
        const distB = haversineDistanceKm(anchorForDinner, b.coords) + catB;
        return distA - distB;
      })[0];

      let dinnerStop: any;
      if (dinnerVenue && (scopeConfig.scope !== "state_wide" || haversineDistanceKm(anchorForDinner, dinnerVenue.coords) <= 55)) {
        scheduledFoodVenues.add(dinnerVenue.id);
        dinnerStop = {
          time: "19:00",
          title: dinnerVenue.name,
          location: `${dinnerVenue.city.toLowerCase().includes(destination.name.toLowerCase()) ? dinnerVenue.city : `${dinnerVenue.city}, ${destination.name}`} · Famous Local Food Spot`,
          description: `Renowned for ${dinnerVenue.famousFor}. Signature specialties: ${dinnerVenue.specialties.join(", ")}. ${dinnerVenue.description}`,
          duration: "90 minutes · Dinner",
          estimatedCost: Math.max(250, Math.round(dailyBudget * 0.28)),
          stopType: "food" as const,
          mealType: "dinner" as const,
          specialties: dinnerVenue.specialties,
          coords: dinnerVenue.coords,
        };
      } else {
        const leisure = getLeisureStop(
          destination.name,
          destination.state,
          "evening",
          dayNumber,
          dailyBudget,
          usedLeisureTitles,
          anchorForDinner
        );
        dinnerStop = {
          time: "19:00",
          title: leisure.title,
          location: leisure.location,
          description: leisure.description,
          duration: leisure.duration,
          estimatedCost: leisure.estimatedCost,
          stopType: "food" as const,
          mealType: "dinner" as const,
          coords: leisure.coords,
        };
      }
      dayStops.push(dinnerStop);

      return recalculateDaySchedule({
        day: dayNumber,
        theme,
        stops: dayStops,
      });
    }

    // Standard day: 3 meal planning (Breakfast, Morning Sight, Lunch, Afternoon Sight, Dinner)
    // 1. Morning Attraction (Day's Geographic Anchor)
    let selectedMorningCand: CandidateAttraction | undefined;

    if (scopeConfig.scope === "state_wide" && availableCandidates.length >= 2) {
      selectedMorningCand = availableCandidates.find(cand => {
        return availableCandidates.some(other => {
          if (areAttractionsDuplicate(cand, other)) return false;
          const dist = haversineDistanceKm(cand.coords, other.coords);
          return dist <= scopeConfig.maxInterStopDistanceKm;
        });
      });
    }

    if (!selectedMorningCand && availableCandidates.length > 0) {
      selectedMorningCand = availableCandidates[0];
    }

    let morningStop: any;
    let morningCoords: { lat: number; lng: number };

    if (selectedMorningCand) {
      scheduledAttractions.push({ id: selectedMorningCand.id, name: selectedMorningCand.name });
      morningCoords = selectedMorningCand.coords;
      morningStop = {
        time: "09:30",
        title: selectedMorningCand.name,
        location: `${selectedMorningCand.area || destination.name}`,
        description: selectedMorningCand.description,
        duration: selectedMorningCand.duration || "2 hours",
        estimatedCost: Math.max(selectedMorningCand.planningCost, Math.round(dailyBudget * 0.22)),
        stopType: "attraction" as const,
        coords: selectedMorningCand.coords,
      };
    } else {
      const leisure = getLeisureStop(
        destination.name,
        destination.state,
        "morning",
        dayNumber,
        dailyBudget,
        usedLeisureTitles,
        destination.coords
      );
      morningCoords = leisure.coords;
      morningStop = {
        time: "09:30",
        title: leisure.title,
        location: leisure.location,
        description: leisure.description,
        duration: leisure.duration,
        estimatedCost: leisure.estimatedCost,
        stopType: "attraction" as const,
        coords: leisure.coords,
      };
    }

    // 2. Afternoon Attraction — Cluster geographically with Morning Stop to prevent cross-region zigzagging
    const remainingCandidates = candidatePool.filter(
      c => !scheduledAttractions.some(used => areAttractionsDuplicate(used, c))
    );

    let candidatePoolForAfternoon = remainingCandidates;
    if (scopeConfig.scope === "state_wide" || scopeConfig.scope === "regional") {
      const withinLimit = remainingCandidates.filter(c => {
        const straightDist = haversineDistanceKm(morningCoords, c.coords);
        return straightDist <= scopeConfig.maxInterStopDistanceKm;
      });
      if (withinLimit.length > 0) {
        candidatePoolForAfternoon = withinLimit;
      }
    }

    let attr2: CandidateAttraction | undefined;
    if (candidatePoolForAfternoon.length > 0) {
      const scoredCandidates = candidatePoolForAfternoon.map(c => {
        const straightDist = haversineDistanceKm(morningCoords, c.coords);
        const distancePenalty = straightDist <= 8 ? straightDist * 0.15 : 1.2 + (straightDist - 8) * 0.45;
        const baseScore = scored.find(s => s.attr.id === c.id)?.score ?? 0;
        return {
          candidate: c,
          affinityScore: baseScore - Math.min(25, distancePenalty),
          distanceKm: straightDist,
        };
      });
      scoredCandidates.sort((a, b) => b.affinityScore - a.affinityScore);
      attr2 = scoredCandidates[0]?.candidate;
    }

    let afternoonStop: any;
    let afternoonCoords: { lat: number; lng: number };

    if (attr2) {
      scheduledAttractions.push({ id: attr2.id, name: attr2.name });
      afternoonCoords = attr2.coords;
      afternoonStop = {
        time: "15:00",
        title: attr2.name,
        location: `${attr2.area || destination.name}`,
        description: attr2.description,
        duration: attr2.duration || "2 hours",
        estimatedCost: Math.max(attr2.planningCost, Math.round(dailyBudget * 0.20)),
        stopType: "attraction" as const,
        coords: attr2.coords,
      };
    } else {
      const leisure = getLeisureStop(
        destination.name,
        destination.state,
        "afternoon",
        dayNumber,
        dailyBudget,
        usedLeisureTitles,
        morningCoords
      );
      afternoonCoords = leisure.coords;
      afternoonStop = {
        time: "15:00",
        title: leisure.title,
        location: leisure.location,
        description: leisure.description,
        duration: leisure.duration,
        estimatedCost: leisure.estimatedCost,
        stopType: "attraction" as const,
        coords: leisure.coords,
      };
    }

    const availableFoods = foodPool.filter(f => !scheduledFoodVenues.has(f.id));
    const dayStops: Array<any> = [];

    // 3. Breakfast Food Spot:
    // If accommodation includes breakfast, do NOT schedule a duplicate paid breakfast stop.
    // Otherwise, select breakfast near accommodation (if available) or morning sight.
    if (!isBreakfastIncluded) {
      const breakfastAnchor = accommodationCoords || morningCoords;
      const breakfastCandidates = availableFoods.filter(f =>
        f.category === "Breakfast" || f.category === "Café & Bakery"
      );
      // Ensure we preserve sufficient food venues for subsequent lunches and dinners
      const neededForLaterMeals = (daysCount - dayIndex) * 2;
      const canUseCatalogueBreakfast =
        breakfastCandidates.length > 0 &&
        availableFoods.length > neededForLaterMeals + 1;

      if (canUseCatalogueBreakfast) {
        const filteredBreakfast = scopeConfig.scope === "state_wide"
          ? breakfastCandidates.filter(f => haversineDistanceKm(breakfastAnchor, f.coords) <= 30)
          : breakfastCandidates;

        const eligibleBreakfast = filteredBreakfast.length > 0
          ? filteredBreakfast
          : (scopeConfig.scope === "state_wide" ? [] : breakfastCandidates);
        const breakfastVenue = [...eligibleBreakfast].sort((a, b) => {
          const distA = haversineDistanceKm(breakfastAnchor, a.coords);
          const distB = haversineDistanceKm(breakfastAnchor, b.coords);
          return distA - distB;
        })[0];

        if (breakfastVenue) {
          scheduledFoodVenues.add(breakfastVenue.id);
          dayStops.push({
            time: "08:00",
            title: breakfastVenue.name,
            location: `${breakfastVenue.city.toLowerCase().includes(destination.name.toLowerCase()) ? breakfastVenue.city : `${breakfastVenue.city}, ${destination.name}`} · Breakfast & Café Spot`,
            description: `Renowned for ${breakfastVenue.famousFor}. Specialties: ${breakfastVenue.specialties.join(", ")}. ${breakfastVenue.description}`,
            duration: "45 minutes · Breakfast",
            estimatedCost: Math.max(120, Math.round(dailyBudget * 0.12)),
            stopType: "food" as const,
            mealType: "breakfast" as const,
            specialties: breakfastVenue.specialties,
            coords: breakfastVenue.coords,
          });
        }
      } else {
        const breakfastLeisure = getLeisureStop(
          destination.name,
          destination.state,
          "breakfast",
          dayNumber,
          dailyBudget,
          usedLeisureTitles,
          breakfastAnchor
        );
        dayStops.push({
          time: "08:00",
          title: breakfastLeisure.title,
          location: breakfastLeisure.location,
          description: breakfastLeisure.description,
          duration: "45 minutes · Breakfast",
          estimatedCost: Math.max(120, Math.round(dailyBudget * 0.12)),
          stopType: "food" as const,
          mealType: "breakfast" as const,
          coords: breakfastLeisure.coords,
        });
      }
    }

    // Add Morning Attraction
    dayStops.push(morningStop);

    // 4. Lunch Food Spot — Choose unscheduled venue minimizing detour between Morning and Afternoon stops
    const remainingFoodsForLunch = foodPool.filter(f => !scheduledFoodVenues.has(f.id));
    const nearbyLunchFoods = remainingFoodsForLunch.filter(f => {
      const distToMorning = haversineDistanceKm(morningCoords, f.coords);
      const distToAfternoon = haversineDistanceKm(f.coords, afternoonCoords);
      if (scopeConfig.scope === "state_wide") {
        return distToMorning <= scopeConfig.maxDetourFoodKm && distToAfternoon <= scopeConfig.maxDetourFoodKm;
      }
      return distToMorning <= scopeConfig.maxDetourFoodKm || distToAfternoon <= scopeConfig.maxDetourFoodKm;
    });

    const eligibleLunch = nearbyLunchFoods.length > 0
      ? nearbyLunchFoods
      : (scopeConfig.scope === "compact_city" ? remainingFoodsForLunch : []);

    const lunchVenue = eligibleLunch.length > 0
      ? [...eligibleLunch].sort((a, b) => {
          const detourA = haversineDistanceKm(morningCoords, a.coords) + haversineDistanceKm(a.coords, afternoonCoords);
          const detourB = haversineDistanceKm(morningCoords, b.coords) + haversineDistanceKm(b.coords, afternoonCoords);
          const prefBonusA = (a.category === "Lunch" || a.category === "Street Food & Snacks") ? -3 : 0;
          const prefBonusB = (b.category === "Lunch" || b.category === "Street Food & Snacks") ? -3 : 0;
          return (detourA + prefBonusA) - (detourB + prefBonusB);
        })[0]
      : undefined;

    if (lunchVenue) {
      scheduledFoodVenues.add(lunchVenue.id);
      dayStops.push({
        time: "12:15",
        title: lunchVenue.name,
        location: `${lunchVenue.city.toLowerCase().includes(destination.name.toLowerCase()) ? lunchVenue.city : `${lunchVenue.city}, ${destination.name}`} · Famous Local Food Spot`,
        description: `Renowned for ${lunchVenue.famousFor}. Signature dishes: ${lunchVenue.specialties.join(", ")}. ${lunchVenue.description}`,
        duration: "90 minutes · Lunch",
        estimatedCost: Math.max(200, Math.round(dailyBudget * 0.22)),
        stopType: "food" as const,
        mealType: "lunch" as const,
        specialties: lunchVenue.specialties,
        coords: lunchVenue.coords,
      });
    } else {
      const foodLeisure = getLeisureStop(
        destination.name,
        destination.state,
        "lunch",
        dayNumber,
        dailyBudget,
        usedLeisureTitles,
        morningCoords
      );
      dayStops.push({
        time: "12:15",
        title: foodLeisure.title,
        location: foodLeisure.location,
        description: foodLeisure.description,
        duration: "90 minutes · Lunch",
        estimatedCost: foodLeisure.estimatedCost,
        stopType: "food" as const,
        mealType: "lunch" as const,
        coords: foodLeisure.coords,
      });
    }

    // Add Afternoon Attraction
    dayStops.push(afternoonStop);

    // 5. Dinner Food Spot — Choose venue near Afternoon stop or accommodation
    const remainingFoodsForDinner = foodPool.filter(f => !scheduledFoodVenues.has(f.id));
    const dinnerAnchor = accommodationCoords || afternoonCoords;
    const dinnerCandidates = remainingFoodsForDinner.filter(f =>
      f.category === "Dinner" || f.category === "Lunch"
    );
    const dinnerPool = dinnerCandidates.length > 0 ? dinnerCandidates : remainingFoodsForDinner;
    const filteredDinner = scopeConfig.scope === "state_wide"
      ? dinnerPool.filter(f => haversineDistanceKm(dinnerAnchor, f.coords) <= 30)
      : dinnerPool;

    const eligibleDinner = filteredDinner.length > 0
      ? filteredDinner
      : (scopeConfig.scope === "state_wide" ? [] : dinnerPool);
    const dinnerVenue = eligibleDinner.length > 0
      ? [...eligibleDinner].sort((a, b) => {
          const catA = a.category === "Dinner" ? 0 : 3;
          const catB = b.category === "Dinner" ? 0 : 3;
          const distA = haversineDistanceKm(dinnerAnchor, a.coords) + catA;
          const distB = haversineDistanceKm(dinnerAnchor, b.coords) + catB;
          return distA - distB;
        })[0]
      : undefined;

    if (dinnerVenue) {
      scheduledFoodVenues.add(dinnerVenue.id);
      dayStops.push({
        time: "19:00",
        title: dinnerVenue.name,
        location: `${dinnerVenue.city.toLowerCase().includes(destination.name.toLowerCase()) ? dinnerVenue.city : `${dinnerVenue.city}, ${destination.name}`} · Famous Local Food Spot`,
        description: `Renowned for ${dinnerVenue.famousFor}. Signature specialties: ${dinnerVenue.specialties.join(", ")}. ${dinnerVenue.description}`,
        duration: "90 minutes · Dinner",
        estimatedCost: Math.max(250, Math.round(dailyBudget * 0.26)),
        stopType: "food" as const,
        mealType: "dinner" as const,
        specialties: dinnerVenue.specialties,
        coords: dinnerVenue.coords,
      });
    } else {
      const dinnerLeisure = getLeisureStop(
        destination.name,
        destination.state,
        "evening",
        dayNumber,
        dailyBudget,
        usedLeisureTitles,
        dinnerAnchor
      );
      dayStops.push({
        time: "19:00",
        title: dinnerLeisure.title,
        location: dinnerLeisure.location,
        description: dinnerLeisure.description,
        duration: "90 minutes · Dinner",
        estimatedCost: dinnerLeisure.estimatedCost,
        stopType: "food" as const,
        mealType: "dinner" as const,
        coords: dinnerLeisure.coords,
      });
    }

    return recalculateDaySchedule({
      day: dayNumber,
      theme,
      stops: dayStops,
    });
  });

  const stylesText = input.styles.join(" and ");
  const isAI = Boolean(options?.isAiGenerated);
  const topAttraction = scheduledAttractions[0]?.name || destination.name;
  const topFood = foodVenues[0]?.name ? ` and celebrated dining at ${foodVenues[0].name}` : "";

  const summary = isAI
    ? `A personalized ${input.days}-day ${destination.name} itinerary curated around ${stylesText}, balancing top sights like ${topAttraction}${topFood} with relaxed pacing.`
    : `A curated ${input.days}-day ${destination.name} itinerary based on the authoritative guide, featuring ${topAttraction}${topFood} tailored for ${stylesText}.`;

  const title = `${destination.name} Explorer: ${input.days} Days in ${destination.name}`;

  return itinerarySchema.parse({
    title: title.length <= 120 ? title : title.slice(0, 119),
    summary: summary.length <= 320 ? summary : `${summary.slice(0, 319).trimEnd()}…`,
    days,
  });
}

/**
 * Safely sanitizes raw text from Gemini / LLM models into clean JSON:
 * - Handles JSON wrapped in markdown code fences (```json and plain ```)
 * - Safely handles surrounding conversational whitespace or text
 * - Throws an informative error if response is empty or unreadable
 */
export function sanitizeGeminiJsonResponse(content: unknown): string {
  const text = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map(part => typeof part === "object" && part && "type" in part && part.type === "text" && "text" in part && typeof part.text === "string" ? part.text : "").join("")
      : "";

  let cleaned = text.trim();
  if (!cleaned) {
    throw new Error("The itinerary model returned no readable content.");
  }

  // Handle standard markdown code fences (```json ... ``` or ``` ... ```)
  const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch && fencedMatch[1]) {
    cleaned = fencedMatch[1].trim();
  } else {
    // Strip partial or unclosed code fence delimiters
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  if (!cleaned) {
    throw new Error("The itinerary model returned no readable content.");
  }

  return cleaned;
}

/**
 * Validates and parses raw Gemini / LLM itinerary response against schema.
 * Rejects malformed or incomplete data; does not silently accept invalid itineraries.
 * Safely falls back to curated engine when AI response is incomplete, invalid, or malformed.
 */
export function generateItineraryWithGemini(
  content: unknown,
  input: TripInput
) {
  try {
    const sanitized = sanitizeGeminiJsonResponse(content);
    const parsedJson = JSON.parse(sanitized);
    const parsed = itinerarySchema.parse(parsedJson);
    if (parsed.days.length !== input.days || parsed.days.some(day => day.stops.length < 2)) {
      throw new Error("The itinerary model returned an incomplete daily plan.");
    }
    return { ...parsed, generatedByAI: true as const };
  } catch (error) {
    console.warn("[TripWise] AI response parsing failed or invalid schema, falling back to curated plan:", error);
    return buildDestinationItinerary(input, { isAiGenerated: false });
  }
}

