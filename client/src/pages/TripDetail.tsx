import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, CalendarDays, CircleDollarSign, Clock3, Edit3, MapPin, Save, ShieldCheck, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { TripNav } from "@/components/TripNav";
import { ThreeBackground } from "@/components/ThreeBackground";
import { TripMap } from "@/components/TripMap";
import { DeleteTripDialog } from "@/components/DeleteTripDialog";
import { useTrip, type CurrentTrip } from "@/contexts/TripContext";
import { getDestination } from "@/data/destinations";
import { trpc } from "@/lib/trpc";
import { formatINR } from "@/lib/tripMath";
import { Button } from "@/components/ui/button";

function recordToTrip(record: { id: number; destination: string; startDate: string; endDate: string; days: number; travelers: number; budgetTier: "Budget" | "Moderate" | "Premium" | "Luxury"; budgetAmount: number; budgetBreakdown: unknown; styles: string[]; title: string; summary: string; itinerary: unknown }): CurrentTrip {
  const total = record.budgetAmount;
  const fallback = { accommodation: Math.round(total * .4), food: Math.round(total * .22), activities: Math.round(total * .19), transport: total - Math.round(total * .81), total, dailyPerTraveler: Math.round(total / Math.max(1, record.days * record.travelers)) };
  return { ...record, itinerary: record.itinerary as CurrentTrip["itinerary"], budget: (record.budgetBreakdown as CurrentTrip["budget"] | null) ?? fallback };
}

export default function TripDetail({ tripId }: { tripId?: string }) {
  const { isAuthenticated, loading } = useAuth();
  const { currentTrip, setCurrentTrip } = useTrip();
  const utils = trpc.useUtils();
  const numericId = Number(tripId);
  const savedTrip = trpc.travel.getTrip.useQuery({ id: numericId || 1 }, { enabled: Boolean(tripId && Number.isInteger(numericId) && isAuthenticated), retry: false });
  const saveTrip = trpc.travel.createTrip.useMutation();
  const trip = useMemo(() => tripId ? (savedTrip.data ? recordToTrip(savedTrip.data) : null) : currentTrip, [tripId, savedTrip.data, currentTrip]);
  const destination = getDestination(trip?.destination);
  const persistTrip = async () => { if (!trip || !isAuthenticated) { toast.error("Sign in to save this trip."); return; } try { const result = await saveTrip.mutateAsync({ destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate, days: trip.days, travelers: trip.travelers, budgetTier: trip.budgetTier, budgetAmount: trip.budgetAmount || trip.budget.total, styles: trip.styles, title: trip.title, summary: trip.summary, itinerary: trip.itinerary, budget: trip.budget }); setCurrentTrip({ ...trip, id: result.id }); toast.success("Saved to your TripWise dashboard."); } catch { toast.error("We could not save this trip yet."); } };
  if (tripId && loading) return <div className="app-shell page-with-scene"><TripNav /><main className="container simple-state">Checking your travel space…</main></div>;
  if (tripId && !isAuthenticated) return <div className="app-shell page-with-scene"><TripNav /><ThreeBackground scene="constellation" /><main className="container simple-state"><ShieldCheck size={27} /><p className="eyebrow">Private journey</p><h1>Sign in to open<br /><em>this itinerary.</em></h1><p>Saved trips are protected by your Manus OAuth session.</p><Button className="button-teal" onClick={startLogin}>Sign in with Manus</Button></main></div>;
  if (savedTrip.isLoading) return <div className="app-shell page-with-scene"><TripNav /><main className="container simple-state">Loading your saved journey…</main></div>;
  if (tripId && savedTrip.isError) return <div className="app-shell page-with-scene"><TripNav /><ThreeBackground scene="constellation" /><main className="container simple-state"><Sparkles size={25} /><p className="eyebrow">Journey unavailable</p><h1>This route is no<br /><em>longer available.</em></h1><p>It may have been removed, or it belongs to a different TripWise account.</p><Link href="/trips"><Button className="button-teal">Return to my journeys</Button></Link></main></div>;
  if (!trip) return <div className="app-shell page-with-scene"><TripNav /><ThreeBackground scene="constellation" /><main className="container simple-state"><Sparkles size={25} /><h1>Nothing is on the route yet.</h1><p>Begin with a few details and let TripWise create your first itinerary.</p><Link href="/planner"><Button className="button-teal">Open planner</Button></Link></main></div>;
  const itineraryStops = trip.itinerary.flatMap(day => day.stops.map(stop => ({ title: stop.title, location: stop.location, description: stop.description, duration: stop.duration })));
  return <div className="app-shell trip-page page-with-scene"><TripNav /><ThreeBackground scene="constellation" /><main className="page-main container"><Link className="back-link" href="/trips"><ArrowLeft size={15} /> My journeys</Link><section className="trip-header glass-card"><div><p className="eyebrow"><Sparkles size={14} /> AI-crafted route</p><h1>{trip.title}</h1><p>{trip.summary}</p><div className="trip-meta"><span><CalendarDays size={15} /> {trip.days} days</span><span><Users size={15} /> {trip.travelers} travellers</span><span><CircleDollarSign size={15} /> {formatINR(trip.budget.total)}</span></div></div><div className="trip-header-actions"><Link href="/planner"><Button variant="outline" className="button-outline"><Edit3 size={15} /> Change trip</Button></Link>{trip.id ? <DeleteTripDialog tripId={trip.id} onDeleted={() => { setCurrentTrip(null); void utils.travel.listTrips.invalidate(); window.location.assign("/trips"); }} /> : <Button className="button-teal" onClick={persistTrip} disabled={saveTrip.isPending}><Save size={15} /> {saveTrip.isPending ? "Saving" : "Save trip"}</Button>}</div></section><div className="trip-detail-grid"><section className="itinerary-card glass-card"><div className="card-title"><div><p className="eyebrow">Day by day</p><h2>Your itinerary</h2></div><span>{trip.styles.join(" · ")}</span></div><div className="timeline">{trip.itinerary.map(day => <article className="itinerary-day" key={day.day}><div className="day-marker"><span>DAY</span><strong>{String(day.day).padStart(2, "0")}</strong></div><div className="day-content"><h3>{day.theme}</h3>{day.stops.map(stop => <div className="trip-stop" key={`${day.day}-${stop.time}-${stop.title}`}><span>{stop.time}</span><i /><div><strong>{stop.title}</strong><small><MapPin size={12} /> {stop.location} · <Clock3 size={12} /> {stop.duration}</small><p>{stop.description}</p></div><b>{formatINR(stop.estimatedCost)}</b></div>)}</div></article>)}</div></section><aside className="trip-side"><section className="budget-card glass-card"><p className="eyebrow">Plan allowance</p><h2>{formatINR(trip.budget.total)}</h2><p className="daily-rate">{formatINR(trip.budget.dailyPerTraveler)} / traveller / day</p>{(["accommodation", "food", "activities", "transport"] as const).map(category => <div className="budget-row" key={category}><span>{category}</span><b>{formatINR(trip.budget[category])}</b></div>)}</section><section className="place-card glass-card"><img src={destination.image} alt="" /><div><p className="eyebrow">Right now in</p><h3>{destination.name}</h3><p>{destination.description}</p></div></section></aside></div><TripMap destination={destination} itineraryStops={itineraryStops} /></main></div>;
}
