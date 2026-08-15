import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Compass, Map, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { TripNav } from "@/components/TripNav";
import { ThreeBackground } from "@/components/ThreeBackground";
import { TripMap } from "@/components/TripMap";
import { destinations, type Destination } from "@/data/destinations";
import { filterDestinations } from "@/lib/destinationFilters";

const regions = ["All", "West", "South", "North", "North East", "East", "Central"] as const;
const categories = ["All", "Coast", "Culture", "Nature", "City", "Mountains"] as const;

export default function Explore() {
  const [region, setRegion] = useState<(typeof regions)[number]>("All");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [active, setActive] = useState<Destination>(destinations[0]);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => filterDestinations(destinations, { region, category, search }), [region, category, search]);
  useEffect(() => { if (filtered.length && !filtered.some(destination => destination.id === active.id)) setActive(filtered[0]); }, [active.id, filtered]);
  return <div className="app-shell explore-page page-with-scene"><TripNav /><ThreeBackground scene="terrain" /><main className="page-main container"><div className="page-intro explore-intro"><p className="eyebrow"><Compass size={14} /> The India atlas</p><h1>Every region.<br /><em>A point of view.</em></h1><p>Explore curated travel gateways across all 28 states and 8 union territories, then map the highlights before you go.</p></div>
    <div className="explore-filters glass-card"><div className="filter-label"><SlidersHorizontal size={16} /><span>Refine the atlas</span></div><label className="destination-search"><Search size={15} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search a state, city or interest" aria-label="Search destinations" /></label><div className="filter-group"><span>Region</span>{regions.map(item => <button key={item} className={region === item ? "active" : ""} onClick={() => setRegion(item)}>{item}</button>)}</div><div className="filter-group"><span>Landscape</span>{categories.map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><span className="atlas-count" aria-live="polite">{filtered.length} gateways</span></div>
    <div className="explore-layout"><div className="destination-list">{filtered.map(destination => <article className={`explore-card ${active.id === destination.id ? "active" : ""}`} key={destination.id} onClick={() => setActive(destination)}><img src={destination.image} alt="" /><div><span>{destination.region} · {destination.category}</span><h3>{destination.name}</h3><p>{destination.description}</p><Link href={`/explore/${destination.id}`} className="explore-detail-link">View guide <ArrowRight size={15} /></Link></div></article>)}{filtered.length === 0 && <div className="empty-state"><MapPin size={23} /><p>No destinations match this combination yet.</p></div>}</div><div className="explore-map-column"><div className="map-context glass-card"><div><p className="eyebrow">Live field map</p><h2>{active.name}</h2></div><Link href={`/explore/${active.id}`} className="text-link">View guide <ArrowRight size={15} /></Link></div><TripMap destination={active} /><div className="poi-strip">{active.points.slice(0, 3).map(point => <div key={point.id}><span>{point.category}</span><strong>{point.name}</strong><small>{point.duration}</small></div>)}</div></div></div>
  </main></div>;
}
