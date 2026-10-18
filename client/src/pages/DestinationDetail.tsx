import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Compass, MapPin, Sparkles } from "lucide-react";
import { TripNav } from "@/components/TripNav";
import { ThreeBackground } from "@/components/ThreeBackground";
import { TripMap } from "@/components/TripMap";
import { destinations } from "@/data/destinations";
import { Button } from "@/components/ui/button";

export default function DestinationDetail({ destinationId }: { destinationId: string }) {
  const destination = destinations.find(item => item.id === destinationId) ?? destinations[0];
  return <div className="app-shell destination-detail-page page-with-scene"><TripNav /><ThreeBackground scene="terrain" /><main className="page-main container"><Link href="/explore" className="back-link"><ArrowLeft size={15} /> Back to the atlas</Link><section className="destination-detail-hero glass-card"><img src={destination.image} alt="" /><div className="destination-detail-shade" /><div className="destination-detail-copy"><p className="eyebrow"><Compass size={14} /> {destination.region} India · {destination.category}</p><h1>{destination.name}</h1><p>{destination.description}</p><Link href="/planner"><Button className="button-teal">Plan this place <ArrowRight size={16} /></Button></Link></div></section><div className="destination-detail-grid"><section className="destination-story glass-card"><p className="eyebrow"><Sparkles size={14} /> A considered starting point</p><h2>The rhythm of {destination.name}.</h2><p>{destination.description} Use the mapped stops as a flexible starting point, then let your preferences determine the pace of each day.</p><div className="experience-list">{destination.points.map((point, index) => <article key={point.id}><span>0{index + 1}</span><div><h3>{point.name}</h3><p>{point.description}</p><small><MapPin size={12} /> {point.category} · {point.duration}</small></div></article>)}</div></section><aside className="destination-facts glass-card"><p className="eyebrow">Travel notes</p><div><span>Best for</span><strong>{destination.category} seekers</strong></div><div><span>Regional setting</span><strong>{destination.region} India</strong></div><div><span>Map stops</span><strong>{destination.points.length} handpicked places</strong></div></aside></div><TripMap destination={destination} /></main></div>;
}
