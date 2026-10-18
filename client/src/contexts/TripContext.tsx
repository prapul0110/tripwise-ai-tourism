import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { BudgetBreakdown, TripInput } from "@/lib/tripMath";

export type ItineraryStop = {
  time: string;
  title: string;
  location: string;
  description: string;
  duration: string;
  estimatedCost: number;
};

export type ItineraryDay = {
  day: number;
  theme: string;
  stops: ItineraryStop[];
};

export type CurrentTrip = TripInput & {
  id?: number;
  title: string;
  summary: string;
  itinerary: ItineraryDay[];
  budget: BudgetBreakdown;
};

type TripContextValue = {
  currentTrip: CurrentTrip | null;
  setCurrentTrip: (trip: CurrentTrip | null) => void;
  draft: Partial<TripInput> | null;
  setDraft: (draft: Partial<TripInput> | null) => void;
};

const TripContext = createContext<TripContextValue | undefined>(undefined);
const tripKey = "tripwise-current-trip";
const draftKey = "tripwise-trip-draft";

export function TripProvider({ children }: { children: ReactNode }) {
  const [currentTrip, setCurrentTrip] = useState<CurrentTrip | null>(() => {
    try { return JSON.parse(localStorage.getItem(tripKey) || "null"); } catch { return null; }
  });
  const [draft, setDraft] = useState<Partial<TripInput> | null>(() => {
    try { return JSON.parse(localStorage.getItem(draftKey) || "null"); } catch { return null; }
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
