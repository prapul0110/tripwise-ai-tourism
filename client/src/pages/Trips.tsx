import { Link } from "wouter";
import { CalendarDays, Copy, Loader2, MapPin, Plus, Users } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { TripNav } from "@/components/TripNav";
import { trpc } from "@/lib/trpc";
import { formatINR } from "@/lib/tripMath";
import { Button } from "@/components/ui/button";
import { DeleteTripDialog } from "@/components/DeleteTripDialog";
import { useTrip } from "@/contexts/TripContext";

export default function Trips() {
  const { isAuthenticated, loading } = useAuth();
  const { setDraft } = useTrip();
  const utils = trpc.useUtils();
  const trips = trpc.travel.listTrips.useQuery(undefined, { enabled: isAuthenticated });
  if (loading) return <div className="app-shell"><TripNav /><main className="container simple-state">Checking your travel space…</main></div>;
  if (!isAuthenticated) return <div className="app-shell trips-page"><TripNav /><main className="container simple-state"><MapPin size={28} /><p className="eyebrow">Your personal travel library</p><h1>Keep every journey<br /><em>within reach.</em></h1><p>Sign in to save, revisit, duplicate and refine your plans.</p><Button className="button-teal" onClick={startLogin}>Sign in to continue</Button></main></div>;
  return <div className="app-shell trips-page"><TripNav /><main className="page-main container"><div className="page-heading-row"><div><p className="eyebrow">Travel archive</p><h1>My <em>journeys.</em></h1><p>Every saved itinerary, ready for the next adjustment.</p></div><Link href="/planner"><Button className="button-teal" onClick={() => setDraft(null)}><Plus size={16} /> New journey</Button></Link></div>{trips.isLoading ? <div className="simple-state"><Loader2 className="animate-spin" /> Loading your journeys…</div> : trips.data?.length ? <div className="saved-trip-grid">{trips.data.map(trip => <article className="saved-trip-card glass-card" key={trip.id}><div className="saved-card-top"><span>{trip.destination}</span><DeleteTripDialog tripId={trip.id} compact onDeleted={async () => { await utils.travel.listTrips.invalidate(); await utils.travel.listTrips.refetch(); }} /></div><h2>{trip.title}</h2><p>{trip.summary}</p><div className="saved-meta"><span><CalendarDays size={14} /> {trip.days} days</span><span><Users size={14} /> {trip.travelers}</span><span>{formatINR(trip.budgetAmount)}</span></div><div className="saved-actions"><Link href={`/trip/${trip.id}`}><Button className="button-teal">Open itinerary</Button></Link><Link href="/planner"><Button variant="ghost" className="button-ghost" onClick={() => setDraft({ destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate, days: trip.days, travelers: trip.travelers, budgetTier: trip.budgetTier, budgetAmount: trip.budgetAmount, styles: trip.styles, isEditing: true })}><Copy size={14} /> Adapt</Button></Link></div></article>)}</div> : <div className="empty-state large-empty"><MapPin size={25} /><h2>Your journey library is open.</h2><p>Plan your first route to start building a considered travel archive.</p><Link href="/planner"><Button className="button-teal" onClick={() => setDraft(null)}>Build a journey</Button></Link></div>}</main></div>;
}
