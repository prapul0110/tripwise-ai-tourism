import { Link } from "wouter";
import { ArrowRight, Compass, MapPinned, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { TripNav } from "@/components/TripNav";
import { ThreeBackground } from "@/components/ThreeBackground";
import { HomeBeachCinematic } from "@/components/HomeBeachCinematic";
import { destinations } from "@/data/destinations";
import { Button } from "@/components/ui/button";

const signals = [
  { icon: <Wand2 size={18} />, title: "Intelligence with intent", text: "Turn dates, budget and travel style into a paced day-by-day route." },
  { icon: <MapPinned size={18} />, title: "Every stop in context", text: "Visualise points of interest and stitch them into a considered route." },
  { icon: <ShieldCheck size={18} />, title: "Built around you", text: "Keep the trip, budget and preferences in one intelligent workspace." },
];

export default function Home() {
  return <div className="app-shell home-page">
    <HomeBeachCinematic />
    <TripNav />
    <main>
      <section className="hero-section section-grid">
        <div className="home-beach-scene" aria-hidden="true"><span /></div>
        <ThreeBackground scene="globe" />
        <div className="container hero-content">
          <div className="hero-copy">
            <p className="eyebrow"><Sparkles size={14} /> A more considered way to move</p>
            <h1>Travel farther.<br /><em>Think deeper.</em></h1>
            <p className="hero-lede">TripWise brings intelligence, place and personal rhythm together to shape journeys worth remembering.</p>
            <div className="hero-actions"><Link href="/planner"><Button className="button-teal button-lg">Build your journey <ArrowRight size={17} /></Button></Link><Link href="/explore"><Button variant="outline" className="button-outline button-lg">Explore destinations</Button></Link></div>
          </div>
          <div className="hero-orbit-card glass-card">
            <div className="orbit-notation"><span>01</span><span>IN / EXPLORE</span><span>2026</span></div>
            <div className="orbit-stat"><Compass size={22} /><div><strong>{destinations.length}</strong><span>India-wide gateways</span></div></div>
            <p>From coastal play to highland calm, begin with a place and make it entirely your own.</p>
            <div className="micro-route"><i /><i /><i /><i /></div>
          </div>
        </div>
        <div className="hero-foot container"><span>DESIGNED FOR INTENTIONAL EXPLORERS</span><span className="line" /><span>SCROLL TO DISCOVER</span></div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <div className="section-heading split-heading"><div><p className="eyebrow">The TripWise method</p><h2>From a blank page to a trip that feels <em>like yours.</em></h2></div><p>Less tab-switching. More meaningful planning. Every recommendation is framed by your route, pace and budget.</p></div>
          <div className="signal-grid">{signals.map((signal, index) => <article className="signal-card" key={signal.title}><span className="signal-index">0{index + 1}</span><div className="signal-icon">{signal.icon}</div><h3>{signal.title}</h3><p>{signal.text}</p></article>)}</div>
        </div>
      </section>

      <section className="section destination-section">
        <div className="container"><div className="section-heading inline-heading"><div><p className="eyebrow">Starting points</p><h2>Places that change your <em>perspective.</em></h2></div><Link href="/explore" className="text-link">View all destinations <ArrowRight size={16} /></Link></div>
          <div className="destination-feature-grid">{destinations.slice(0, 3).map((destination, index) => <Link href={`/explore?destination=${destination.id}`} className={`destination-feature destination-${index}`} key={destination.id}><img src={destination.image} alt="" /><div className="feature-overlay" /><div className="destination-feature-copy"><span>{destination.region} India · {destination.category}</span><h3>{destination.name}</h3><p>{destination.description}</p><i><ArrowRight size={18} /></i></div></Link>)}</div>
        </div>
      </section>

      <section className="section final-cta"><ThreeBackground scene="orbit" /><div className="container final-cta-content"><p className="eyebrow">Your next chapter</p><h2>Build a trip with<br /><em>more signal.</em></h2><p>Bring your dates, your people and the way you want to feel. We will help shape the rest.</p><Link href="/planner"><Button className="button-teal button-lg">Start planning <ArrowRight size={17} /></Button></Link></div></section>
    </main>
    <footer className="site-footer"><div className="container"><div className="brand"><span className="brand-mark"><Compass size={16} /></span>Trip<span>Wise</span></div><p>AI-guided travel, designed with care.</p><span>© 2026 TripWise</span></div></footer>
  </div>;
}
