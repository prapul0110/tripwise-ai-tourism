import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CalendarDays, Check, CircleDollarSign, Compass, Loader2, MapPin, Sparkles, Users, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { TripNav } from "@/components/TripNav";
import { useTrip } from "@/contexts/TripContext";
import { destinations, matchDestination } from "@/data/destinations";
import { trpc } from "@/lib/trpc";
import { calculateTripBudget, formatINR, type BudgetTier, type TripInput } from "@/lib/tripMath";
import { addDaysToDateString, adjustPlannerDates, blankPlannerForm, computeDuration, validatePlannerForm, type PlannerForm } from "@/lib/plannerHelpers";
import { Button } from "@/components/ui/button";

const styles = ["Adventure", "Culture", "Relaxation", "Food", "Nature", "History", "Photography", "Family"];
const today = new Date().toISOString().slice(0, 10);

function getDestinationFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const param = searchParams.get("destination") || searchParams.get("dest");
    if (param) {
      const matched = matchDestination(param);
      if (matched) return matched.name;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default function Planner() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { draft, setDraft, setCurrentTrip } = useTrip();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<PlannerForm>(() => {
    const urlDest = getDestinationFromUrl();

    // 1. Explicit destination from URL query param takes authoritative priority (e.g. "Plan this place")
    if (urlDest) {
      return {
        ...blankPlannerForm,
        destination: urlDest,
        ...(draft?.isEditing ? {
          startDate: draft.startDate || "",
          endDate: draft.endDate || "",
          days: draft.days || 0,
          travelers: draft.travelers || 0,
          budgetTier: (draft.budgetTier as BudgetTier) || "",
          budgetAmount: typeof draft.budgetAmount === "number" ? draft.budgetAmount : "",
          styles: Array.isArray(draft.styles) ? draft.styles : [],
        } : {}),
      };
    }

    // 2. Active editing session from TripDetail ("Change trip" or "Adapt")
    if (draft?.isEditing && draft.destination) {
      const matched = matchDestination(draft.destination);
      return {
        ...blankPlannerForm,
        destination: matched ? matched.name : draft.destination,
        startDate: draft.startDate || "",
        endDate: draft.endDate || "",
        days: draft.days || 0,
        travelers: draft.travelers || 0,
        budgetTier: (draft.budgetTier as BudgetTier) || "",
        budgetAmount: typeof draft.budgetAmount === "number" ? draft.budgetAmount : "",
        styles: Array.isArray(draft.styles) ? draft.styles : [],
      };
    }

    // 3. Direct opening of AI Planner -> start completely blank
    return { ...blankPlannerForm };
  });

  const createItinerary = trpc.travel.generateItinerary.useMutation();

  const isBudgetReady = Boolean(
    form.days > 0 &&
    form.travelers > 0 &&
    form.budgetTier &&
    typeof form.budgetAmount === "number" &&
    form.budgetAmount >= 1000
  );

  const calculatedBudget = useMemo(() => {
    if (!isBudgetReady || !form.budgetTier || typeof form.budgetAmount !== "number") {
      return null;
    }
    return calculateTripBudget({
      days: form.days,
      travelers: form.travelers,
      budgetTier: form.budgetTier,
      budgetAmount: form.budgetAmount,
      styles: form.styles,
    });
  }, [isBudgetReady, form.days, form.travelers, form.budgetTier, form.budgetAmount, form.styles]);

  useEffect(() => {
    const urlDest = getDestinationFromUrl();
    if (urlDest) {
      setForm(prev => {
        if (prev.destination === urlDest) return prev;
        return { ...prev, destination: urlDest };
      });
      return;
    }

    if (draft?.isEditing && draft.destination) {
      const matched = matchDestination(draft.destination);
      const destName = matched ? matched.name : draft.destination;
      setForm(prev => ({
        ...prev,
        destination: destName,
        startDate: draft.startDate || prev.startDate,
        endDate: draft.endDate || prev.endDate,
        days: draft.days || prev.days,
        travelers: draft.travelers || prev.travelers,
        budgetTier: (draft.budgetTier as BudgetTier) || prev.budgetTier,
        budgetAmount: typeof draft.budgetAmount === "number" ? draft.budgetAmount : prev.budgetAmount,
        styles: Array.isArray(draft.styles) ? draft.styles : prev.styles,
      }));
    }
  }, [draft]);

  const clearError = (field: string) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateForm = <K extends keyof PlannerForm>(key: K, value: PlannerForm[K]) => {
    clearError(key as string);
    setForm(previous => {
      const next = { ...previous, [key]: value };

      if (key === "startDate" || key === "endDate") {
        const adjusted = adjustPlannerDates(
          previous.startDate,
          previous.endDate,
          key,
          value as string
        );
        next.startDate = adjusted.startDate;
        next.endDate = adjusted.endDate;
        next.days = adjusted.days;

        if (adjusted.days > 0) {
          clearError("endDate");
          clearError("days");
        } else if (next.startDate && next.endDate && next.endDate < next.startDate) {
          setErrors(prev => ({ ...prev, endDate: "Departure date must be on or after arrival date." }));
        }
      }

      return next;
    });
  };

  const updateDuration = (newDays: number) => {
    clearError("days");
    setForm(previous => {
      const next = { ...previous, days: newDays };
      if (previous.startDate && newDays >= 1) {
        next.endDate = addDaysToDateString(previous.startDate, newDays - 1);
        clearError("endDate");
      }
      return next;
    });
  };

  const toggleStyle = (style: string) => {
    clearError("styles");
    setForm(previous => {
      const current = previous.styles;
      const nextStyles = current.includes(style)
        ? current.filter(item => item !== style)
        : [...current, style];
      return { ...previous, styles: nextStyles };
    });
  };

  const submitPlan = async () => {
    const validationErrors = validatePlannerForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please complete all required fields before generating your itinerary.");
      return;
    }

    setErrors({});

    const budget = calculatedBudget || calculateTripBudget({
      days: form.days,
      travelers: form.travelers,
      budgetTier: form.budgetTier as BudgetTier,
      budgetAmount: Number(form.budgetAmount),
      styles: form.styles,
    });

    const tripPayload = {
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      days: form.days,
      travelers: form.travelers,
      budgetTier: form.budgetTier as BudgetTier,
      budgetAmount: budget.total,
      styles: form.styles,
    };

    setDraft({ ...tripPayload, isEditing: true });

    if (authLoading) {
      toast.info("Checking your secure TripWise session. Please try again in a moment.");
      return;
    }

    if (!isAuthenticated) {
      toast.info("Your choices are saved. Sign in to create your AI itinerary.");
      startLogin();
      return;
    }

    try {
      const itinerary = await createItinerary.mutateAsync(tripPayload);
      setCurrentTrip({
        ...tripPayload,
        title: itinerary.title,
        summary: itinerary.summary,
        itinerary: itinerary.days,
        budget,
      });
      setDraft(null);
      toast.success("Your itinerary is ready to explore.");
      setLocation("/trip/current");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not generate that trip yet.");
    }
  };

  return (
    <div className="app-shell planner-page">
      <TripNav />
      <main className="page-main container">
        <div className="page-intro">
          <p className="eyebrow"><Wand2 size={14} /> Intelligent itinerary studio</p>
          <h1>Tell us how you<br /><em>want to feel.</em></h1>
          <p>We will turn your constraints into a thoughtful route that leaves room for the unexpected.</p>
        </div>

        <div className="planner-layout">
          <section className="planner-card glass-card">
            <div className="planner-card-head">
              <div>
                <span className="step-count">01</span>
                <h2>Build your brief</h2>
              </div>
              <span className="planner-hint">All fields adapt your plan</span>
            </div>

            <div className="form-grid">
              <label className="field-group full">
                <span><MapPin size={15} /> Destination</span>
                <select
                  value={form.destination}
                  onChange={event => updateForm("destination", event.target.value)}
                  aria-label="Destination"
                  className={errors.destination ? "has-error" : ""}
                >
                  <option value="" disabled>Select a destination...</option>
                  {destinations.map(destination => (
                    <option key={destination.id} value={destination.name}>
                      {destination.name}
                    </option>
                  ))}
                </select>
                {errors.destination && <span className="field-error-text">{errors.destination}</span>}
              </label>

              <label className="field-group">
                <span><CalendarDays size={15} /> Arrive</span>
                <input
                  type="date"
                  min={today}
                  value={form.startDate}
                  onChange={event => updateForm("startDate", event.target.value)}
                  aria-label="Arrival date"
                  className={errors.startDate ? "has-error" : ""}
                />
                {errors.startDate && <span className="field-error-text">{errors.startDate}</span>}
              </label>

              <label className="field-group">
                <span><CalendarDays size={15} /> Depart</span>
                <input
                  type="date"
                  min={form.startDate || today}
                  value={form.endDate}
                  onChange={event => updateForm("endDate", event.target.value)}
                  aria-label="Departure date"
                  className={errors.endDate ? "has-error" : ""}
                />
                {errors.endDate && <span className="field-error-text">{errors.endDate}</span>}
              </label>

              <label className="field-group">
                <span><Compass size={15} /> Duration</span>
                <select
                  value={form.days}
                  onChange={event => updateDuration(Number(event.target.value))}
                  aria-label="Duration"
                  className={errors.days ? "has-error" : ""}
                >
                  <option value="0" disabled>Select duration...</option>
                  {Array.from({ length: 30 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1} day{index ? "s" : ""}
                    </option>
                  ))}
                </select>
                {errors.days && <span className="field-error-text">{errors.days}</span>}
              </label>

              <label className="field-group">
                <span><Users size={15} /> Travellers</span>
                <select
                  value={form.travelers}
                  onChange={event => updateForm("travelers", Number(event.target.value))}
                  aria-label="Travellers"
                  className={errors.travelers ? "has-error" : ""}
                >
                  <option value="0" disabled>Select travellers...</option>
                  {Array.from({ length: 20 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1} traveller{index ? "s" : ""}
                    </option>
                  ))}
                </select>
                {errors.travelers && <span className="field-error-text">{errors.travelers}</span>}
              </label>

              <label className="field-group">
                <span><CircleDollarSign size={15} /> Budget style</span>
                <select
                  value={form.budgetTier}
                  onChange={event => updateForm("budgetTier", event.target.value as BudgetTier)}
                  aria-label="Budget style"
                  className={errors.budgetTier ? "has-error" : ""}
                >
                  <option value="" disabled>Select budget style...</option>
                  {["Budget", "Moderate", "Premium", "Luxury"].map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
                {errors.budgetTier && <span className="field-error-text">{errors.budgetTier}</span>}
              </label>

              <label className="field-group">
                <span><CircleDollarSign size={15} /> Total allowance</span>
                <input
                  inputMode="numeric"
                  min="1000"
                  max="2000000"
                  type="number"
                  placeholder="e.g. 45000 (min ₹1,000)"
                  value={form.budgetAmount === "" ? "" : form.budgetAmount}
                  onChange={event => {
                    const val = event.target.value;
                    updateForm("budgetAmount", val === "" ? "" : Number(val));
                  }}
                  aria-label="Total allowance"
                  className={errors.budgetAmount ? "has-error" : ""}
                />
                {errors.budgetAmount && <span className="field-error-text">{errors.budgetAmount}</span>}
              </label>
            </div>

            <div className="style-section">
              <span className="field-label">Travel styles</span>
              <div className="style-pills">
                {styles.map(style => (
                  <button
                    type="button"
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className={form.styles.includes(style) ? "selected" : ""}
                  >
                    {form.styles.includes(style) && <Check size={13} />}
                    {style}
                  </button>
                ))}
              </div>
              {errors.styles && <span className="field-error-text">{errors.styles}</span>}
            </div>

            <Button
              className="button-teal button-plan"
              onClick={submitPlan}
              disabled={createItinerary.isPending || authLoading}
            >
              {createItinerary.isPending ? (
                <><Loader2 className="animate-spin" size={17} /> Composing your route</>
              ) : authLoading ? (
                <><Loader2 className="animate-spin" size={17} /> Checking your session</>
              ) : (
                <><Sparkles size={17} /> Generate my itinerary</>
              )}
            </Button>
          </section>

          <aside className="planner-summary glass-card" aria-label="Live planning allowance">
            <div className="summary-topline">
              <span>Live planning allowance</span>
              {calculatedBudget && <span className="pulse-dot" />}
            </div>
            {calculatedBudget ? (
              <>
                <h3>{formatINR(calculatedBudget.total)}</h3>
                <p>{formatINR(calculatedBudget.dailyPerTraveler)} daily, per traveller</p>
                <div className="budget-bars">
                  {(["accommodation", "food", "activities", "transport"] as const).map(category => (
                    <div key={category}>
                      <div>
                        <span>{category}</span>
                        <b>{formatINR(calculatedBudget[category])}</b>
                      </div>
                      <i>
                        <em style={{ width: `${(calculatedBudget[category] / calculatedBudget.total) * 100}%` }} />
                      </i>
                    </div>
                  ))}
                </div>
                <div className="summary-note">
                  <Sparkles size={16} />
                  <p>Change any input and your allocation updates instantly.</p>
                </div>
              </>
            ) : (
              <>
                <div className="summary-placeholder" style={{ padding: "34px 0 16px", textAlign: "center" }}>
                  <Sparkles size={28} style={{ margin: "0 auto 12px", color: "#58e0d0", opacity: 0.8 }} />
                  <h4 style={{ color: "#eaffff", fontSize: "19px", fontFamily: '"Playfair Display", serif', fontWeight: 500, margin: "0 0 10px" }}>
                    Budget breakdown
                  </h4>
                  <p style={{ color: "#80a7a6", fontSize: "13px", lineHeight: "1.6", margin: "0 auto", maxWidth: "250px" }}>
                    Complete your trip details to see your budget breakdown.
                  </p>
                </div>
                <div className="summary-note" style={{ marginTop: "20px" }}>
                  <Sparkles size={16} />
                  <p>Select dates, travellers, budget style and total allowance to view live allocations.</p>
                </div>
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
