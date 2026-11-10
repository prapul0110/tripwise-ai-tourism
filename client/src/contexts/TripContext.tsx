import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { BudgetBreakdown, TripInput } from "@/lib/tripMath";
import type { AccommodationSelection } from "@/data/accommodations";

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
  coords?: { lat: number; lng: number };
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

export type CurrentTrip = TripInput & {
  id?: number;
  title: string;
  summary: string;
  itinerary: ItineraryDay[];
  budget: BudgetBreakdown;
  accommodation?: AccommodationSelection | null;
};

export type TripDraft = Partial<TripInput> & {
  isEditing?: boolean;
};

type TripContextValue = {
  currentTrip: CurrentTrip | null;
  setCurrentTrip: (trip: CurrentTrip | null) => void;
  draft: TripDraft | null;
  setDraft: (draft: TripDraft | null) => void;
};

const TripContext = createContext<TripContextValue | undefined>(undefined);
const tripKey = "tripwise-current-trip";
const draftKey = "tripwise-trip-draft";

export function TripProvider({ children }: { children: ReactNode }) {
  const [currentTrip, setCurrentTrip] = useState<CurrentTrip | null>(() => {
    try { return JSON.parse(localStorage.getItem(tripKey) || "null"); } catch { return null; }
  });
  const [draft, setDraft] = useState<TripDraft | null>(() => {
    try {
      const stored = localStorage.getItem(draftKey);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as TripDraft;
      if (parsed && Array.isArray(parsed.styles)) {
        const hasLegacyDefaults = parsed.styles.length === 2 && parsed.styles.includes("Relaxation") && parsed.styles.includes("Food");
        if (hasLegacyDefaults && !parsed.isEditing) {
          parsed.styles = [];
          try { localStorage.setItem(draftKey, JSON.stringify(parsed)); } catch { /* ignore */ }
        }
      }
      return parsed;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentTrip) localStorage.setItem(tripKey, JSON.stringify(currentTrip));
    else localStorage.removeItem(tripKey);
  }, [currentTrip]);

  useEffect(() => {
    if (draft) localStorage.setItem(draftKey, JSON.stringify(draft));
    else localStorage.removeItem(draftKey);
  }, [draft]);

  const value = useMemo(() => ({ currentTrip, setCurrentTrip, draft, setDraft }), [currentTrip, draft]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error("useTrip must be used inside TripProvider");
  return context;
}
