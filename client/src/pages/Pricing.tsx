import { Link } from "wouter";
import { ArrowRight, Check, Compass, Sparkles } from "lucide-react";
import { TripNav } from "@/components/TripNav";
import { Button } from "@/components/ui/button";

export default function Pricing() {
  const features = [
    "Unlimited AI itinerary generation",
    "Detailed daily schedules with transit estimates",
    "Curated attractions & authentic culinary spots",
    "Full itinerary editing, reordering & removal",
    "Interactive spatial field map with directions",
    "Accommodation planning & dynamic budget calculations",
    "Save and revisit unlimited journeys in your personal library",
  ];

  return (
    <div className="app-shell pricing-page">
      <TripNav />
      <main className="page-main container">
        <div className="pricing-intro" style={{ maxWidth: "760px", margin: "0 auto 40px", textAlign: "center" }}>
          <p className="eyebrow" style={{ justifyContent: "center" }}>
            <Sparkles size={14} /> 100% Free & Open
          </p>
          <h1>
            TripWise AI is <em>100% free.</em>
          </h1>
          <p style={{ maxWidth: "620px", margin: "0 auto" }}>
            Every traveler gets full access to all features. No subscriptions, no tiers, and no payment requirements.
          </p>
        </div>

        <div style={{ maxWidth: "760px", margin: "0 auto 36px" }}>
          <section className="glass-card" style={{ padding: "36px 32px" }}>
            <p className="eyebrow" style={{ marginBottom: "16px", color: "var(--teal-300, #5ee0d3)" }}>
              <Compass size={15} /> All features unlocked for everyone
            </p>
            <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", margin: "0 0 28px", padding: 0, listStyle: "none" }}>
              {features.map((feature) => (
                <li key={feature} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#e2f1f0" }}>
                  <Check size={16} style={{ color: "#5ee0d3", flexShrink: 0 }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", paddingTop: "12px", borderTop: "1px solid rgba(111, 229, 218, 0.15)" }}>
              <Link href="/planner">
                <Button className="button-teal button-lg flex items-center gap-2">
                  Start Planning <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" className="button-outline button-lg">
                  Explore Destinations
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
