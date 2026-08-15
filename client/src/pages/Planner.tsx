import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CalendarDays, Check, CircleDollarSign, Compass, Loader2, MapPin, Sparkles, Users, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { TripNav } from "@/components/TripNav";
import { ThreeBackground } from "@/components/ThreeBackground";
import { useTrip } from "@/contexts/TripContext";
import { destinations } from "@/data/destinations";
import { trpc } from "@/lib/trpc";
import { calculateTripBudget, dayCount, formatINR, type TripInput } from "@/lib/tripMath";
import { Button } from "@/components/ui/button";

const styles = ["Adventure", "Culture", "Relaxation", "Food", "Nature", "History", "Photography", "Family"];
const today = new Date().toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const afterFourDays = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);

const initialInput: TripInput = { destination: "Goa", startDate: nextWeek, endDate: afterFourDays, days: 4, travelers: 2, budgetTier: "Moderate", budgetAmount: 38000, styles: ["Relaxation", "Food"] };

export default function Planner() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { draft, setDraft, setCurrentTrip } = useTrip();
  const [form, setForm] = useState<TripInput>(() => ({ ...initialInput, ...draft }));
  const createItinerary = trpc.travel.generateItinerary.useMutation();
  const calculatedBudget = useMemo(() => calculateTripBudget(form), [form]);

  useEffect(() => { if (draft) setForm(previous => ({ ...previous, ...draft })); }, [draft]);
  const updateForm = <K extends keyof TripInput>(key: K, value: TripInput[K]) => setForm(previous => {
    const next = { ...previous, [key]: value };
    if (key === "startDate" || key === "endDate") next.days = dayCount(next.startDate, next.endDate);
    return next;
  });
  const toggleStyle = (style: string) => updateForm("styles", form.styles.includes(style) ? form.styles.filter(item => item !== style) : [...form.styles, style]);

  const submitPlan = async () => {
    if (!form.destination || form.styles.length === 0) { toast.error("Select a destination and at least one travel style."); return; }
    setDraft(form);
    if (authLoading) { toast.info("Checking your secure TripWise session. Please try again in a moment."); return; }
    if (!isAuthenticated) { toast.info("Your choices are saved. Sign in to create your AI itinerary."); startLogin(); return; }
    try {
      const itinerary = await createItinerary.mutateAsync({ ...form, budgetAmount: calculatedBudget.total });
      setCurrentTrip({ ...form, budgetAmount: calculatedBudget.total, title: itinerary.title, summary: itinerary.summary, itinerary: itinerary.days, budget: calculatedBudget });
      setDraft(null);
      toast.success("Your itinerary is ready to explore.");
      setLocation("/trip/current");
    } catch (error) { toast.error(error instanceof Error ? error.message : "We could not generate that trip yet."); }
  };

  return <div className="app-shell planner-page page-with-scene"><TripNav /><ThreeBackground scene="particles" /><main className="page-main container"><div className="page-intro"><p className="eyebrow"><Wand2 size={14} /> Intelligent itinerary studio</p><h1>Tell us how you<br /><em>want to feel.</em></h1><p>We will turn your constraints into a thoughtful route that leaves room for the unexpected.</p></div>
    <div className="planner-layout">
      <section className="planner-card glass-card">
        <div className="planner-card-head"><div><span className="step-count">01</span><h2>Build your brief</h2></div><span className="planner-hint">All fields adapt your plan</span></div>
        <div className="form-grid">
          <label className="field-group full"><span><MapPin size={15} /> Destination</span><select value={form.destination} onChange={event => updateForm("destination", event.target.value)}>{destinations.map(destination => <option key={destination.id}>{destination.name}</option>)}</select></label>
          <label className="field-group"><span><CalendarDays size={15} /> Arrive</span><input type="date" min={today} value={form.startDate} onChange={event => updateForm("startDate", event.target.value)} /></label>
          <label className="field-group"><span><CalendarDays size={15} /> Depart</span><input type="date" min={form.startDate || today} value={form.endDate} onChange={event => updateForm("endDate", event.target.value)} /></label>
          <label className="field-group"><span><Compass size={15} /> Duration</span><select value={form.days} onChange={event => updateForm("days", Number(event.target.value))}>{Array.from({ length: 30 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} day{index ? "s" : ""}</option>)}</select></label>
          <label className="field-group"><span><Users size={15} /> Travellers</span><select value={form.travelers} onChange={event => updateForm("travelers", Number(event.target.value))}>{Array.from({ length: 20 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} traveller{index ? "s" : ""}</option>)}</select></label>
          <label className="field-group"><span><CircleDollarSign size={15} /> Budget style</span><select value={form.budgetTier} onChange={event => updateForm("budgetTier", event.target.value as TripInput["budgetTier"])}>{["Budget", "Moderate", "Premium", "Luxury"].map(tier => <option key={tier}>{tier}</option>)}</select></label>
          <label className="field-group"><span><CircleDollarSign size={15} /> Total allowance</span><input inputMode="numeric" min="1000" max="2000000" type="number" value={form.budgetAmount} onChange={event => updateForm("budgetAmount", Number(event.target.value))} /></label>
        </div>
        <div className="style-section"><span className="field-label">Travel styles</span><div className="style-pills">{styles.map(style => <button key={style} onClick={() => toggleStyle(style)} className={form.styles.includes(style) ? "selected" : ""}>{form.styles.includes(style) && <Check size={13} />}{style}</button>)}</div></div>
        <Button className="button-teal button-plan" onClick={submitPlan} disabled={createItinerary.isPending || authLoading}>{createItinerary.isPending ? <><Loader2 className="animate-spin" size={17} /> Composing your route</> : authLoading ? <><Loader2 className="animate-spin" size={17} /> Checking your session</> : <><Sparkles size={17} /> Generate my itinerary</>}</Button>
      </section>
      <aside className="planner-summary glass-card"><div className="summary-topline"><span>Live planning allowance</span><span className="pulse-dot" /></div><h3>{formatINR(calculatedBudget.total)}</h3><p>{formatINR(calculatedBudget.dailyPerTraveler)} daily, per traveller</p><div className="budget-bars">{(["accommodation", "food", "activities", "transport"] as const).map(category => <div key={category}><div><span>{category}</span><b>{formatINR(calculatedBudget[category])}</b></div><i><em style={{ width: `${(calculatedBudget[category] / calculatedBudget.total) * 100}%` }} /></i></div>)}</div><div className="summary-note"><Sparkles size={16} /><p>Change any input and your allocation updates instantly.</p></div></aside>
    </div>
  </main></div>;
}
