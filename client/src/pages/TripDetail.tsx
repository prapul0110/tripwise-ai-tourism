import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CalendarDays, Car, ChevronDown, ChevronUp, CircleDollarSign, Clock3, Coffee, Edit3, ExternalLink, Hotel, Loader2, MapPin, Plus, RotateCcw, Save, ShieldCheck, Sparkles, Trash2, Users, UtensilsCrossed, Wine } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { TripNav } from "@/components/TripNav";
import { TripMap } from "@/components/TripMap";
import { DeleteTripDialog } from "@/components/DeleteTripDialog";
import { AddStopDialog } from "@/components/AddStopDialog";
import { AccommodationDialog } from "@/components/AccommodationDialog";
import type { StopCandidate } from "@/lib/destinationStops";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTrip, type CurrentTrip, type ItineraryStop } from "@/contexts/TripContext";
import { getDestination, getCategoryFallbackImage } from "@/data/destinations";
import type { AccommodationSelection } from "@/data/accommodations";
import { trpc } from "@/lib/trpc";
import { formatINR } from "@/lib/tripMath";
import { Button } from "@/components/ui/button";
import { recalculateDaySchedule, ensureStopId, generateStableStopId, getStopMealType, type ItineraryDay } from "@shared/routeRecalculation";
import { useNavigationBlocker } from "@/lib/navigationGuard";

function recordToTrip(record: { id: number; destination: string; startDate: string; endDate: string; days: number; travelers: number; budgetTier: "Budget" | "Moderate" | "Premium" | "Luxury"; budgetAmount: number; budgetBreakdown: unknown; styles: string[]; title: string; summary: string; itinerary: unknown; accommodation?: unknown }): CurrentTrip {
  const total = record.budgetAmount;
  const fallback = { accommodation: Math.round(total * .4), food: Math.round(total * .22), activities: Math.round(total * .19), transport: total - Math.round(total * .81), total, dailyPerTraveler: Math.round(total / Math.max(1, record.days * record.travelers)) };
  const loadedAccommodation = (record.accommodation as AccommodationSelection | null) ?? null;
  const rawBudget = (record.budgetBreakdown as CurrentTrip["budget"] | null) ?? fallback;

  // Ensure accommodation in budget reflects actual selected stay cost (0 if no stay selected)
  const actualAccommodation = loadedAccommodation ? loadedAccommodation.totalCost : 0;
  const budget = {
    ...rawBudget,
    accommodation: actualAccommodation,
  };

  return {
    ...record,
    itinerary: record.itinerary as CurrentTrip["itinerary"],
    budget,
    accommodation: loadedAccommodation,
  };
}

export default function TripDetail({ tripId }: { tripId?: string }) {
  const { isAuthenticated, loading } = useAuth();
  const { currentTrip, setCurrentTrip, setDraft } = useTrip();
  const utils = trpc.useUtils();
  const numericId = Number(tripId);
  const savedTrip = trpc.travel.getTrip.useQuery({ id: numericId || 1 }, { enabled: Boolean(tripId && Number.isInteger(numericId) && isAuthenticated), retry: false });
  const saveTrip = trpc.travel.createTrip.useMutation();
  const updateTripMutation = trpc.travel.updateTrip.useMutation();
  const regenerateMutation = trpc.travel.generateItinerary.useMutation();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const isSaving = updateTripMutation.isPending || saveTrip.isPending;

  const trip = useMemo(() => tripId ? (savedTrip.data ? recordToTrip(savedTrip.data) : null) : currentTrip, [tripId, savedTrip.data, currentTrip]);
  const destination = getDestination(trip?.destination);

  // Local editing state for itinerary days
  const [editedDays, setEditedDays] = useState<ItineraryDay[] | null>(null);
  const [editedAccommodation, setEditedAccommodation] = useState<AccommodationSelection | null | undefined>(undefined);
  const [accommodationDialogOpen, setAccommodationDialogOpen] = useState(false);
  const [stopToRemove, setStopToRemove] = useState<{
    dayNumber: number;
    stopIndex: number;
    stopTitle: string;
    stopId?: string;
  } | null>(null);
  const [addStopDay, setAddStopDay] = useState<number | null>(null);

  // Key tracking to reset edits when switching between trips
  const tripSyncKey = trip ? `${trip.id ?? "local"}-${trip.destination}-${trip.startDate}-${trip.endDate}` : null;
  const [activeTripKey, setActiveTripKey] = useState<string | null>(null);

  useEffect(() => {
    if (tripSyncKey !== activeTripKey) {
      setActiveTripKey(tripSyncKey);
      setEditedAccommodation(undefined);
      if (trip?.itinerary) {
        setEditedDays(
          trip.itinerary.map(day => ({
            ...day,
            stops: day.stops.map((stop, sIdx) => ensureStopId(stop, day.day, sIdx)),
          }))
        );
      } else {
        setEditedDays(null);
      }
    }
  }, [tripSyncKey, activeTripKey, trip]);

  const displayedDays = editedDays ?? trip?.itinerary ?? [];
  const displayedAccommodation = editedAccommodation !== undefined ? editedAccommodation : (trip?.accommodation ?? null);

  const displayedBudget = useMemo(() => {
    if (!trip) return null;
    const actualAccommodation = displayedAccommodation ? displayedAccommodation.totalCost : 0;
    const allocatedAccommodation = typeof trip.budget.accommodation === "number" && trip.budget.accommodation > 0
      ? trip.budget.accommodation
      : Math.round((trip.budgetAmount || trip.budget.total) * 0.40);

    const otherCosts = (trip.budget.food || 0) + (trip.budget.activities || 0) + (trip.budget.transport || 0);
    const activeTotal = actualAccommodation + otherCosts;
    const dailyPerTraveler = Math.round(activeTotal / Math.max(1, trip.days * trip.travelers));

    return {
      ...trip.budget,
      accommodation: actualAccommodation,
      allocatedAccommodation,
      total: activeTotal,
      dailyPerTraveler,
      plannedTotal: trip.budget.total,
      plannedDailyPerTraveler: trip.budget.dailyPerTraveler,
    };
  }, [trip, displayedAccommodation]);

  const hasUnsavedChanges = useMemo(() => {
    // Check itinerary changes
    let itineraryChanged = false;
    if (trip?.itinerary && editedDays) {
      if (trip.itinerary.length !== editedDays.length) {
        itineraryChanged = true;
      } else {
        for (let d = 0; d < trip.itinerary.length; d++) {
          const orig = trip.itinerary[d]?.stops || [];
          const edit = editedDays[d]?.stops || [];
          if (orig.length !== edit.length) {
            itineraryChanged = true;
            break;
          }
          for (let s = 0; s < orig.length; s++) {
            if (orig[s]?.title !== edit[s]?.title || orig[s]?.time !== edit[s]?.time) {
              itineraryChanged = true;
              break;
            }
          }
          if (itineraryChanged) break;
        }
      }
    }

    // Check accommodation changes
    let accommodationChanged = false;
    if (editedAccommodation !== undefined) {
      const origId = trip?.accommodation?.id ?? (trip?.accommodation?.name || null);
      const editId = editedAccommodation?.id ?? (editedAccommodation?.name || null);
      if (origId !== editId) {
        accommodationChanged = true;
      } else if (trip?.accommodation?.totalCost !== editedAccommodation?.totalCost) {
        accommodationChanged = true;
      } else if (trip?.accommodation?.roomCount !== editedAccommodation?.roomCount) {
        accommodationChanged = true;
      }
    }

    return itineraryChanged || accommodationChanged;
  }, [trip?.itinerary, trip?.accommodation, editedDays, editedAccommodation]);

  // Protect against accidental loss of unsaved edits on browser refresh / page close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Internal Wouter navigation guard for unsaved changes (TripNav, back-link, popstate)
  useNavigationBlocker(
    hasUnsavedChanges && !isSaving,
    "You have unsaved itinerary changes. Are you sure you want to leave this page?"
  );

  const handleResetEdits = () => {
    if (trip?.itinerary) {
      setEditedDays(
        trip.itinerary.map(day => ({
          ...day,
          stops: day.stops.map((stop, sIdx) => ensureStopId(stop, day.day, sIdx)),
        }))
      );
    }
    setEditedAccommodation(undefined);
    toast.info("Itinerary changes discarded.");
  };

  const handleMoveStop = (dayNumber: number, fromIndex: number, toIndex: number) => {
    const baseDays = editedDays || trip?.itinerary || [];
    const dayIdx = baseDays.findIndex(d => d.day === dayNumber);
    if (dayIdx === -1) return;

    const targetDay = baseDays[dayIdx]!;
    if (fromIndex < 0 || fromIndex >= targetDay.stops.length) return;
    if (toIndex < 0 || toIndex >= targetDay.stops.length) return;

    const newStops = [...targetDay.stops];
    const [moved] = newStops.splice(fromIndex, 1);
    if (!moved) return;
    newStops.splice(toIndex, 0, moved);

    const updatedDay = recalculateDaySchedule({ ...targetDay, stops: newStops });
    const nextDays = [...baseDays];
    nextDays[dayIdx] = updatedDay;
    setEditedDays(nextDays);
    toast.success(`Moved ${moved.title} to Stop ${toIndex + 1}.`);
  };

  const handleRemoveStop = (dayNumber: number, stopIndex: number) => {
    const baseDays = editedDays || trip?.itinerary || [];
    const dayIdx = baseDays.findIndex(d => d.day === dayNumber);
    if (dayIdx === -1) return;

    const targetDay = baseDays[dayIdx]!;
    if (stopIndex < 0 || stopIndex >= targetDay.stops.length) return;

    const removedTitle = targetDay.stops[stopIndex]?.title || "Stop";
    const newStops = targetDay.stops.filter((_, idx) => idx !== stopIndex);

    const updatedDay = recalculateDaySchedule({ ...targetDay, stops: newStops });
    const nextDays = [...baseDays];
    nextDays[dayIdx] = updatedDay;
    setEditedDays(nextDays);
    toast.success(`Removed ${removedTitle} from Day ${dayNumber}.`);
  };

  const handleToggleMealType = (dayNumber: number, stopIndex: number, newMealType: "breakfast" | "lunch" | "dinner") => {
    const baseDays = editedDays || trip?.itinerary || [];
    const dayIdx = baseDays.findIndex(d => d.day === dayNumber);
    if (dayIdx === -1) return;
    const targetDay = baseDays[dayIdx]!;
    if (stopIndex < 0 || stopIndex >= targetDay.stops.length) return;

    const updatedStops = [...targetDay.stops];
    const targetStop = { ...updatedStops[stopIndex]! };
    targetStop.mealType = newMealType;
    targetStop.stopType = "food";
    const capMeal = newMealType.charAt(0).toUpperCase() + newMealType.slice(1);
    if (targetStop.duration && /breakfast|lunch|dinner/i.test(targetStop.duration)) {
      targetStop.duration = targetStop.duration.replace(/breakfast|lunch|dinner/gi, capMeal);
    } else {
      targetStop.duration = newMealType === "breakfast" ? "45 minutes · Breakfast" : `90 minutes · ${capMeal}`;
    }
    updatedStops[stopIndex] = targetStop;

    const updatedDay = recalculateDaySchedule({ ...targetDay, stops: updatedStops });
    const nextDays = [...baseDays];
    nextDays[dayIdx] = updatedDay;
    setEditedDays(nextDays);
    toast.success(`Updated ${targetStop.title} to ${capMeal}.`);
  };

  const handleAddStop = (dayNumber: number, candidate: StopCandidate) => {
    const baseDays = editedDays || trip?.itinerary || [];
    const dayIdx = baseDays.findIndex(d => d.day === dayNumber);
    if (dayIdx === -1) return;

    // Check cross-day duplicate prevention
    const alreadyExists = baseDays.some(d =>
      d.stops.some(s => s.title.toLowerCase().trim() === candidate.title.toLowerCase().trim())
    );
    if (alreadyExists) {
      toast.error(`"${candidate.title}" is already scheduled in this itinerary.`);
      return;
    }

    const targetDay = baseDays[dayIdx]!;
    const initialTime =
      candidate.mealType === "breakfast"
        ? "08:00"
        : candidate.mealType === "dinner"
        ? "19:00"
        : candidate.mealType === "lunch"
        ? "12:15"
        : "15:00";

    const newStop: ItineraryStop = {
      id: generateStableStopId(dayNumber, candidate.title, targetDay.stops.length),
      time: initialTime,
      title: candidate.title,
      location: candidate.location,
      description: candidate.description,
      duration: candidate.duration,
      estimatedCost: candidate.estimatedCost,
      stopType: candidate.stopType,
      mealType: candidate.mealType,
      specialties: candidate.specialties,
      coords: candidate.coords,
    };

    // When newly added stop is breakfast, insert it in the appropriate breakfast position (start of day)
    let newStops: ItineraryStop[];
    if (candidate.mealType === "breakfast") {
      const firstStopMeal = targetDay.stops.length > 0 ? getStopMealType(targetDay.stops[0]!) : null;
      const insertIndex = firstStopMeal === "breakfast" ? 1 : 0;
      newStops = [...targetDay.stops];
      newStops.splice(insertIndex, 0, newStop);
    } else {
      newStops = [...targetDay.stops, newStop];
    }

    const updatedDay = recalculateDaySchedule({
      ...targetDay,
      stops: newStops,
    });

    const nextDays = [...baseDays];
    nextDays[dayIdx] = updatedDay;
    setEditedDays(nextDays);
    toast.success(`Added "${candidate.title}" to Day ${dayNumber}.`);
  };

  const persistTrip = async () => {
    if (!trip) return;
    if (!isAuthenticated) {
      toast.error("Sign in to save this trip.");
      startLogin();
      return;
    }
    if (saveTrip.isPending) return;

    try {
      const finalBudget = displayedBudget ?? trip.budget;
      const result = await saveTrip.mutateAsync({
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        days: trip.days,
        travelers: trip.travelers,
        budgetTier: trip.budgetTier,
        budgetAmount: trip.budgetAmount || finalBudget.total,
        styles: trip.styles,
        title: trip.title,
        summary: trip.summary,
        itinerary: displayedDays,
        budget: finalBudget,
        accommodation: displayedAccommodation,
      });

      const newSavedTrip: CurrentTrip = {
        ...trip,
        id: result.id,
        itinerary: displayedDays,
        accommodation: displayedAccommodation,
        budget: finalBudget,
      };
      setCurrentTrip(newSavedTrip);
      await utils.travel.listTrips.invalidate();

      setEditedDays(
        displayedDays.map(day => ({
          ...day,
          stops: day.stops.map((stop, sIdx) => ensureStopId(stop, day.day, sIdx)),
        }))
      );
      setEditedAccommodation(undefined);

      toast.success("Saved to your TripWise dashboard.");
    } catch {
      toast.error("We could not save this trip yet.");
    }
  };

  const handleSaveChanges = async () => {
    if (!trip) return;

    if (!isAuthenticated) {
      toast.error("Sign in to save changes to this trip.");
      startLogin();
      return;
    }

    if (isSaving) return;

    if (trip.id) {
      try {
        const finalBudget = displayedBudget ?? trip.budget;
        await updateTripMutation.mutateAsync({
          id: trip.id,
          itinerary: displayedDays,
          accommodation: displayedAccommodation,
          budgetBreakdown: finalBudget,
        });

        const updatedTrip: CurrentTrip = {
          ...trip,
          itinerary: displayedDays,
          accommodation: displayedAccommodation,
          budget: finalBudget,
        };
        setCurrentTrip(updatedTrip);

        await utils.travel.getTrip.invalidate({ id: trip.id });
        await utils.travel.listTrips.invalidate();

        setEditedDays(
          displayedDays.map(day => ({
            ...day,
            stops: day.stops.map((stop, sIdx) => ensureStopId(stop, day.day, sIdx)),
          }))
        );
        setEditedAccommodation(undefined);

        toast.success("Itinerary and stay changes saved permanently.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save itinerary changes.");
      }
    } else {
      await persistTrip();
    }
  };

  const handleRegenerate = async () => {
    if (!trip) return;
    setIsRegenerating(true);
    try {
      const fresh = await regenerateMutation.mutateAsync({
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        days: trip.days,
        travelers: trip.travelers,
        budgetTier: trip.budgetTier,
        budgetAmount: trip.budgetAmount || trip.budget.total,
        styles: trip.styles.length > 0 ? trip.styles : ["Culture", "Food"],
      });
      setCurrentTrip({
        ...trip,
        title: fresh.title,
        summary: fresh.summary,
        itinerary: fresh.days,
      });
      toast.success("A freshly curated itinerary has been composed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate route.");
    } finally {
      setIsRegenerating(false);
    }
  };

  if (tripId && loading) return <div className="app-shell"><TripNav /><main className="container simple-state">Checking your travel space…</main></div>;
  if (tripId && !isAuthenticated) return <div className="app-shell"><TripNav /><main className="container simple-state"><ShieldCheck size={27} /><p className="eyebrow">Private journey</p><h1>Sign in to open<br /><em>this itinerary.</em></h1><p>Saved trips are protected by your TripWise account.</p><Button className="button-teal" onClick={startLogin}>Sign in</Button></main></div>;
  if (savedTrip.isLoading) return <div className="app-shell"><TripNav /><main className="container simple-state">Loading your saved journey…</main></div>;
  if (tripId && savedTrip.isError) return <div className="app-shell"><TripNav /><main className="container simple-state"><Sparkles size={25} /><p className="eyebrow">Journey unavailable</p><h1>This route is no<br /><em>longer available.</em></h1><p>It may have been removed, or it belongs to a different TripWise account.</p><Link href="/trips"><Button className="button-teal">Return to my journeys</Button></Link></main></div>;
  if (!trip) return <div className="app-shell"><TripNav /><main className="container simple-state"><Sparkles size={25} /><h1>Nothing is on the route yet.</h1><p>Begin with a few details and let TripWise create your first itinerary.</p><Link href="/planner"><Button className="button-teal" onClick={() => setDraft(null)}>Open planner</Button></Link></main></div>;

  const itineraryStops = displayedDays.flatMap(day =>
    day.stops.map(stop => ({
      title: stop.title,
      location: stop.location,
      description: stop.description,
      duration: stop.duration,
      stopType: stop.stopType,
      specialties: stop.specialties,
      coords: stop.coords,
    }))
  );

  return (
    <div className="app-shell trip-page">
      <TripNav />
      <main className="page-main container">
        <Link className="back-link" href="/trips">
          <ArrowLeft size={15} /> My journeys
        </Link>
        <section className="trip-header glass-card">
          <div>
            <p className="eyebrow">
              <Sparkles size={14} /> AI-crafted route
            </p>
            <h1>{trip.title}</h1>
            <p>{trip.summary}</p>
            <div className="trip-meta">
              <span><CalendarDays size={15} /> {trip.days} days</span>
              <span><Users size={15} /> {trip.travelers} travellers</span>
              <span><CircleDollarSign size={15} /> {formatINR(trip.budget.total)}</span>
            </div>
          </div>
          <div className="trip-header-actions">
            {hasUnsavedChanges && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#fbbf24",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <Sparkles size={13} /> Unsaved edits
                </span>
                <Button
                  className="button-teal"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  title="Save itinerary changes permanently"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving changes...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Save changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="button-outline"
                  onClick={handleResetEdits}
                  disabled={isSaving}
                  title="Discard local edits and restore original itinerary"
                >
                  <RotateCcw size={14} /> Discard edits
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              className="button-outline"
              onClick={handleRegenerate}
              disabled={isRegenerating || regenerateMutation.isPending}
            >
              {isRegenerating ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
              Regenerate route
            </Button>
            <Link href="/planner">
              <Button
                variant="outline"
                className="button-outline"
                onClick={() => setDraft({
                  destination: trip.destination,
                  startDate: trip.startDate,
                  endDate: trip.endDate,
                  days: trip.days,
                  travelers: trip.travelers,
                  budgetTier: trip.budgetTier,
                  budgetAmount: trip.budgetAmount || trip.budget.total,
                  styles: trip.styles,
                  isEditing: true,
                })}
              >
                <Edit3 size={15} /> Change trip
              </Button>
            </Link>
            {trip.id ? (
              <DeleteTripDialog
                tripId={trip.id}
                onDeleted={() => {
                  setCurrentTrip(null);
                  void utils.travel.listTrips.invalidate();
                  window.location.assign("/trips");
                }}
              />
            ) : (
              <Button className="button-teal" onClick={persistTrip} disabled={saveTrip.isPending}>
                <Save size={15} /> {saveTrip.isPending ? "Saving" : "Save trip"}
              </Button>
            )}
          </div>
        </section>

        <div className="trip-detail-grid">
          <section className="itinerary-card glass-card">
            <div className="card-title">
              <div>
                <p className="eyebrow">Day by day</p>
                <h2>Your itinerary</h2>
              </div>
              <span>{trip.styles.join(" · ")}</span>
            </div>

            {/* Dedicated Accommodation Section */}
            {displayedAccommodation ? (
              <div
                style={{
                  margin: "0 0 20px 0",
                  padding: "16px 18px",
                  borderRadius: "14px",
                  border: "1px solid rgba(45, 212, 191, 0.28)",
                  background: "linear-gradient(135deg, rgba(13, 148, 136, 0.12), rgba(10, 38, 34, 0.7))",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(168, 85, 247, 0.18)", color: "#c084fc", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(168, 85, 247, 0.35)", textTransform: "uppercase" }}>
                        <Hotel size={12} /> {displayedAccommodation.type || "Hotel"}
                      </span>
                      {displayedAccommodation.isBreakfastIncluded && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                          <Coffee size={12} /> Breakfast Included
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
                      {displayedAccommodation.name}
                    </h3>
                    <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={12} style={{ color: "#2dd4bf" }} /> {displayedAccommodation.address}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#2dd4bf" }}>
                      {formatINR(displayedAccommodation.totalCost)}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {formatINR(displayedAccommodation.pricePerNight)} / night · {displayedAccommodation.nights} nights
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px", padding: "8px 12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", margin: "8px 0", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Room:</span> <strong style={{ color: "#f8fafc" }}>{displayedAccommodation.roomType}</strong> ({displayedAccommodation.roomCount})
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Dates:</span> <strong style={{ color: "#f8fafc" }}>{displayedAccommodation.checkIn} → {displayedAccommodation.checkOut}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Guests:</span> <strong style={{ color: "#f8fafc" }}>{displayedAccommodation.guestCount} travelers</strong>
                  </div>
                </div>

                {displayedAccommodation.amenities && displayedAccommodation.amenities.length > 0 && (
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
                    {displayedAccommodation.amenities.slice(0, 6).map(a => (
                      <span key={a} style={{ background: "rgba(255, 255, 255, 0.06)", color: "#cbd5e1", fontSize: "10px", padding: "1px 6px", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  {displayedAccommodation.bookingUrl ? (
                    <a
                      href={displayedAccommodation.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#38bdf8", fontSize: "12px", textDecoration: "none" }}
                    >
                      <ExternalLink size={12} /> Booking partner
                    </a>
                  ) : <span />}

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setAccommodationDialogOpen(true)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "rgba(45, 212, 191, 0.12)", border: "1px solid rgba(45, 212, 191, 0.3)", borderRadius: "6px", color: "#2dd4bf", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
                    >
                      <Hotel size={12} /> Change stay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditedAccommodation(null);
                        toast.info("Accommodation removed. Click Save changes to persist.");
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "6px", color: "#fca5a5", fontSize: "11px", cursor: "pointer" }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  margin: "0 0 20px 0",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px dashed rgba(45, 212, 191, 0.3)",
                  background: "rgba(10, 38, 34, 0.35)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#2dd4bf", fontSize: "11px", fontWeight: 600, marginBottom: "2px" }}>
                    <Hotel size={13} /> Accommodation
                  </div>
                  <h4 style={{ margin: 0, fontSize: "14px", color: "#f8fafc" }}>No stay selected for this trip</h4>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>Browse curated hotels, resorts & heritage stays in {destination.name}</p>
                </div>
                <Button
                  className="button-teal"
                  onClick={() => setAccommodationDialogOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", padding: "6px 12px" }}
                >
                  <Plus size={13} /> Select stay
                </Button>
              </div>
            )}

            <div className="timeline">
              {displayedDays.map(day => (
                <article className="itinerary-day" key={day.day}>
                  <div className="day-marker">
                    <span>DAY</span>
                    <strong>{String(day.day).padStart(2, "0")}</strong>
                  </div>
                  <div className="day-content">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                      <h3>{day.theme}</h3>
                      {(day.formattedDailyDistance || (day.totalDistanceKm && day.totalDistanceKm > 0)) && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(45, 212, 191, 0.12)", color: "#5eead4", fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "12px", border: "1px solid rgba(45, 212, 191, 0.25)" }}>
                          <Car size={12} /> Daily travel: {day.formattedDailyDistance ?? `~${day.totalDistanceKm} km`} · {day.formattedDailyTransit ?? `~${day.totalTransitMinutes} mins`}
                        </span>
                      )}
                    </div>

                    {displayedAccommodation?.isBreakfastIncluded && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          marginBottom: "12px",
                          borderRadius: "6px",
                          background: "rgba(245, 158, 11, 0.08)",
                          border: "1px dashed rgba(245, 158, 11, 0.25)",
                          color: "#fbbf24",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        <Coffee size={12} />
                        <span>Breakfast included at <strong>{displayedAccommodation.name}</strong></span>
                      </div>
                    )}

                    {day.stops.length === 0 ? (
                      <div style={{ padding: "16px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px dashed rgba(255, 255, 255, 0.15)", color: "#94a3b8", textAlign: "center", fontSize: "13px", margin: "10px 0" }}>
                        All stops for Day {day.day} have been removed. Use "Discard edits" in the header to restore.
                      </div>
                    ) : (
                      day.stops.map((stop, sIdx) => {
                        const mealType = getStopMealType(stop);
                        const isBreakfast = mealType === "breakfast";
                        const isLunch = mealType === "lunch";
                        const isDinner = mealType === "dinner";
                        const isFood = stop.stopType === "food" || Boolean(mealType);
                        const specialties = stop.specialties;
                        const transit = stop.transitToNext;
                        return (
                          <div key={stop.id ?? `${day.day}-${stop.time}-${stop.title}`}>
                            <div className="trip-stop">
                              <span>{stop.time}</span>
                              <i
                                style={
                                  isBreakfast
                                    ? { background: "#f59e0b", boxShadow: "0 0 10px rgba(245, 158, 11, 0.5)" }
                                    : isLunch
                                    ? { background: "#ea580c", boxShadow: "0 0 10px rgba(234, 88, 12, 0.5)" }
                                    : isDinner
                                    ? { background: "#a855f7", boxShadow: "0 0 10px rgba(168, 85, 247, 0.5)" }
                                    : undefined
                                }
                              />
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                                  <span style={{ fontSize: "11px", fontWeight: 700, color: isFood ? "#f59e0b" : "#2dd4bf", background: isFood ? "rgba(217, 119, 6, 0.15)" : "rgba(45, 212, 191, 0.12)", padding: "1px 6px", borderRadius: "4px", border: isFood ? "1px solid rgba(217, 119, 6, 0.3)" : "1px solid rgba(45, 212, 191, 0.25)" }}>
                                    Stop {sIdx + 1}
                                  </span>
                                  <strong>{stop.title}</strong>
                                  {isFood ? (
                                    <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(0,0,0,0.25)", borderRadius: "14px", padding: "1px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleMealType(day.day, sIdx, "breakfast")}
                                        title="Click to set as Breakfast"
                                        style={{
                                          background: isBreakfast ? "rgba(245, 158, 11, 0.35)" : "transparent",
                                          color: isBreakfast ? "#fbbf24" : "#64748b",
                                          border: isBreakfast ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid transparent",
                                          borderRadius: "12px",
                                          padding: "2px 7px",
                                          fontSize: "10px",
                                          fontWeight: isBreakfast ? 700 : 500,
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "3px",
                                        }}
                                      >
                                        <Coffee size={10} /> Breakfast
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleMealType(day.day, sIdx, "lunch")}
                                        title="Click to set as Lunch"
                                        style={{
                                          background: isLunch ? "rgba(234, 88, 12, 0.35)" : "transparent",
                                          color: isLunch ? "#fb923c" : "#64748b",
                                          border: isLunch ? "1px solid rgba(234, 88, 12, 0.4)" : "1px solid transparent",
                                          borderRadius: "12px",
                                          padding: "2px 7px",
                                          fontSize: "10px",
                                          fontWeight: isLunch ? 700 : 500,
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "3px",
                                        }}
                                      >
                                        <UtensilsCrossed size={10} /> Lunch
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleMealType(day.day, sIdx, "dinner")}
                                        title="Click to set as Dinner"
                                        style={{
                                          background: isDinner ? "rgba(168, 85, 247, 0.35)" : "transparent",
                                          color: isDinner ? "#c084fc" : "#64748b",
                                          border: isDinner ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid transparent",
                                          borderRadius: "12px",
                                          padding: "2px 7px",
                                          fontSize: "10px",
                                          fontWeight: isDinner ? 700 : 500,
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "3px",
                                        }}
                                      >
                                        <Wine size={10} /> Dinner
                                      </button>
                                    </div>
                                  ) : (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(45, 212, 191, 0.12)", color: "#5eead4", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(45, 212, 191, 0.25)" }}>
                                      <MapPin size={11} /> Sightseeing
                                    </span>
                                  )}
                                </div>
                                <small>
                                  <MapPin size={12} /> {stop.location} · <Clock3 size={12} /> Visit duration: {stop.duration}
                                </small>
                                <p>{stop.description}</p>
                                {specialties && specialties.length > 0 && (
                                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                                    {specialties.map(spec => (
                                      <span key={spec} style={{ background: "rgba(255, 255, 255, 0.08)", color: "#fef3c7", fontSize: "11px", padding: "1px 7px", borderRadius: "4px", border: "1px solid rgba(217, 119, 6, 0.25)" }}>
                                        {spec}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <b>{formatINR(stop.estimatedCost)}</b>
                                <div style={{ display: "flex", alignItems: "center", gap: "3px", marginLeft: "4px" }}>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveStop(day.day, sIdx, sIdx - 1)}
                                    disabled={sIdx === 0}
                                    title={sIdx === 0 ? "First stop in day" : "Move stop up"}
                                    style={{
                                      background: "rgba(255, 255, 255, 0.06)",
                                      border: "1px solid rgba(255, 255, 255, 0.14)",
                                      borderRadius: "4px",
                                      color: sIdx === 0 ? "rgba(255, 255, 255, 0.2)" : "#a5f3fc",
                                      cursor: sIdx === 0 ? "not-allowed" : "pointer",
                                      padding: "3px 4px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <ChevronUp size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveStop(day.day, sIdx, sIdx + 1)}
                                    disabled={sIdx === day.stops.length - 1}
                                    title={sIdx === day.stops.length - 1 ? "Last stop in day" : "Move stop down"}
                                    style={{
                                      background: "rgba(255, 255, 255, 0.06)",
                                      border: "1px solid rgba(255, 255, 255, 0.14)",
                                      borderRadius: "4px",
                                      color: sIdx === day.stops.length - 1 ? "rgba(255, 255, 255, 0.2)" : "#a5f3fc",
                                      cursor: sIdx === day.stops.length - 1 ? "not-allowed" : "pointer",
                                      padding: "3px 4px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <ChevronDown size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStopToRemove({ dayNumber: day.day, stopIndex: sIdx, stopTitle: stop.title, stopId: stop.id })}
                                    title="Remove stop"
                                    style={{
                                      background: "rgba(239, 68, 68, 0.08)",
                                      border: "1px solid rgba(239, 68, 68, 0.25)",
                                      borderRadius: "4px",
                                      color: "#fca5a5",
                                      cursor: "pointer",
                                      padding: "3px 4px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {transit && (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0 14px 44px", padding: "6px 12px", background: "rgba(13, 148, 136, 0.08)", borderRadius: "6px", borderLeft: "2px dashed rgba(45, 212, 191, 0.4)", color: "#a5f3fc", fontSize: "12px" }}>
                                <Car size={13} style={{ color: "#2dd4bf", flexShrink: 0 }} />
                                <span>
                                  Transit to next stop: <b>{transit.formattedDuration}</b> · <b>{transit.formattedDistance}</b>
                                </span>
                                <span style={{ marginLeft: "auto", fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: transit.source === "google_maps" ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.08)", color: transit.source === "google_maps" ? "#86efac" : "#94a3b8" }}>
                                  {transit.source === "google_maps" ? "Google Maps route" : "Estimated road"}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Stop Button at bottom of each itinerary day */}
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setAddStopDay(day.day)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 14px",
                        background: "rgba(45, 212, 191, 0.1)",
                        border: "1px solid rgba(45, 212, 191, 0.25)",
                        borderRadius: "8px",
                        color: "#2dd4bf",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(45, 212, 191, 0.2)";
                        e.currentTarget.style.borderColor = "rgba(45, 212, 191, 0.4)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(45, 212, 191, 0.1)";
                        e.currentTarget.style.borderColor = "rgba(45, 212, 191, 0.25)";
                      }}
                    >
                      <Plus size={14} />
                      <span>Add Stop to Day {day.day}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="trip-side">
            <section className="budget-card glass-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <p className="eyebrow" style={{ margin: 0 }}>Budget & Expenses</p>
                {displayedAccommodation ? (
                  <span style={{ fontSize: "11px", color: "#2dd4bf", fontWeight: 600 }}>Stay Booked</span>
                ) : (
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>No Stay Selected</span>
                )}
              </div>

              <div style={{ margin: "10px 0 16px" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {displayedAccommodation ? "Active Total (Actual Stay)" : "Total Planned Allowance"}
                </div>
                <h2 style={{ margin: "2px 0 0" }}>
                  {formatINR(displayedAccommodation ? (displayedBudget?.total ?? trip.budget.total) : trip.budget.total)}
                </h2>
                <p className="daily-rate" style={{ margin: "4px 0 0" }}>
                  {formatINR(displayedAccommodation ? (displayedBudget?.dailyPerTraveler ?? trip.budget.dailyPerTraveler) : trip.budget.dailyPerTraveler)} / traveller / day
                </p>
                {displayedAccommodation && (
                  <div style={{ marginTop: "6px", fontSize: "11px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                    <span>Original planned allowance:</span>
                    <strong style={{ color: "#94a3b8" }}>{formatINR(trip.budget.total)}</strong>
                  </div>
                )}
              </div>

              {/* Accommodation Breakdown Row: Clearly separates Actual Expense from Allocated Allowance */}
              <div className="budget-row" style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span style={{ fontWeight: 600, color: "#f8fafc" }}>Accommodation (Actual)</span>
                  <b style={{ color: displayedAccommodation ? "#2dd4bf" : "#94a3b8" }}>
                    {displayedAccommodation ? formatINR(displayedAccommodation.totalCost) : "₹0"}
                  </b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", fontSize: "11px", color: "#64748b" }}>
                  <span>Allocated allowance:</span>
                  <span>{formatINR(displayedBudget?.allocatedAccommodation ?? trip.budget.accommodation)}</span>
                </div>
              </div>

              {/* Other Categories */}
              {(["food", "activities", "transport"] as const).map(category => (
                <div className="budget-row" key={category}>
                  <span style={{ textTransform: "capitalize" }}>{category} (Allowance)</span>
                  <b>{formatINR(trip.budget[category])}</b>
                </div>
              ))}
            </section>
            <section className="place-card glass-card">
              <img
                src={destination.image}
                alt={destination.name}
                onError={e => {
                  const fb = getCategoryFallbackImage(destination.category);
                  if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
                }}
              />
              <div>
                <p className="eyebrow">Right now in</p>
                <h3>{destination.name}</h3>
                <p>{destination.description}</p>
              </div>
            </section>
          </aside>
        </div>

        <TripMap destination={destination} itineraryStops={itineraryStops} days={displayedDays} accommodation={displayedAccommodation} />

        <AlertDialog open={Boolean(stopToRemove)} onOpenChange={(open) => !open && setStopToRemove(null)}>
          <AlertDialogContent style={{ background: "#0a2622", border: "1px solid rgba(45, 212, 191, 0.25)", color: "#f8fafc" }}>
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: "#f8fafc" }}>Remove Stop from Itinerary?</AlertDialogTitle>
              <AlertDialogDescription style={{ color: "#94a3b8" }}>
                Are you sure you want to remove <strong>{stopToRemove?.stopTitle}</strong> from Day {stopToRemove?.dayNumber}?
                The remaining route and transit times will be recalculated automatically.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", color: "#f8fafc" }}>
                Keep stop
              </AlertDialogCancel>
              <AlertDialogAction
                style={{ background: "#dc2626", color: "#ffffff" }}
                onClick={() => {
                  if (stopToRemove) {
                    handleRemoveStop(stopToRemove.dayNumber, stopToRemove.stopIndex);
                    setStopToRemove(null);
                  }
                }}
              >
                Remove stop
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AddStopDialog
          open={addStopDay !== null}
          onOpenChange={open => !open && setAddStopDay(null)}
          dayNumber={addStopDay}
          destinationName={trip?.destination || ""}
          itinerary={displayedDays}
          onAddStop={handleAddStop}
        />

        <AccommodationDialog
          open={accommodationDialogOpen}
          onOpenChange={setAccommodationDialogOpen}
          destinationId={destination?.id || trip?.destination || ""}
          destinationName={destination?.name || trip?.destination || ""}
          startDate={trip?.startDate}
          endDate={trip?.endDate}
          days={trip?.days}
          travelers={trip?.travelers}
          currentAccommodation={displayedAccommodation}
          onSelectAccommodation={(selection) => {
            setEditedAccommodation(selection);
            setAccommodationDialogOpen(false);
            toast.success(`Selected stay: ${selection.name}`);
          }}
        />
      </main>
    </div>
  );
}
