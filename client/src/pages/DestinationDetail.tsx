import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Compass, MapPin, Sparkles, UtensilsCrossed } from "lucide-react";
import { TripNav } from "@/components/TripNav";
import { TripMap } from "@/components/TripMap";
import { destinations, getCategoryFallbackImage, getFoodPlacesForDestination } from "@/data/destinations";
import { Button } from "@/components/ui/button";
import { useTrip } from "@/contexts/TripContext";

export default function DestinationDetail({ destinationId }: { destinationId: string }) {
  const { setDraft } = useTrip();
  const destination = destinations.find(item => item.id === destinationId) ?? destinations[0];
  const foodSpots = getFoodPlacesForDestination(destination.id);

  return (
    <div className="app-shell destination-detail-page">
      <TripNav />
      <main className="page-main container">
        <Link href="/explore" className="back-link">
          <ArrowLeft size={15} /> Back to the atlas
        </Link>
        <section className="destination-detail-hero glass-card">
          <img
            src={destination.image}
            alt={destination.name}
            onError={e => {
              const fb = getCategoryFallbackImage(destination.category);
              if (e.currentTarget.src !== fb) e.currentTarget.src = fb;
            }}
          />
          <div className="destination-detail-shade" />
          <div className="destination-detail-copy">
            <p className="eyebrow">
              <Compass size={14} /> {destination.region} India · {destination.category}
            </p>
            <h1>{destination.name}</h1>
            <p>{destination.description}</p>
            <Link
              href={`/planner?destination=${encodeURIComponent(destination.id)}`}
              onClick={() => {
                setDraft({
                  destination: destination.name,
                  isEditing: false,
                });
              }}
            >
              <Button className="button-teal">
                Plan this place <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </section>

        <div className="destination-detail-grid">
          <section className="destination-story glass-card">
            <p className="eyebrow">
              <Sparkles size={14} /> A considered starting point
            </p>
            <h2>The rhythm of {destination.name}.</h2>
            <p>
              {destination.description} Use the mapped stops as a flexible starting point, then let your preferences determine the pace of each day.
            </p>
            <div className="experience-list">
              {destination.points.map((point, index) => (
                <article key={point.id}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{point.name}</h3>
                    <p>{point.description}</p>
                    <small>
                      <MapPin size={12} /> {point.category} · {point.duration}
                    </small>
                  </div>
                </article>
              ))}
            </div>

            {foodSpots.length > 0 && (
              <div className="food-spots-section" style={{ marginTop: "2.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "2rem" }}>
                <p className="eyebrow" style={{ color: "#2dd4bf" }}>
                  <UtensilsCrossed size={14} /> Famous Local Food Spots & Dining
                </p>
                <h3 style={{ fontSize: "1.4rem", margin: "0.5rem 0 1rem", color: "#f0fdfa" }}>
                  Iconic flavours of {destination.name}
                </h3>
                <div className="experience-list">
                  {foodSpots.map((food, index) => (
                    <article key={food.id} style={{ borderColor: "rgba(45,212,191,0.2)" }}>
                      <span style={{ color: "#2dd4bf" }}>F{index + 1}</span>
                      <div>
                        <h3>{food.name} <small style={{ color: "#2dd4bf", marginLeft: "6px", fontSize: "11px", fontWeight: 600 }}>{food.priceRange} · {food.category}</small></h3>
                        <p>{food.famousFor}. {food.description}</p>
                        <small>
                          <UtensilsCrossed size={12} /> Specialties: {food.specialties.join(", ")}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="destination-facts glass-card">
            <p className="eyebrow">Travel notes</p>
            <div>
              <span>Best for</span>
              <strong>{destination.category} seekers</strong>
            </div>
            <div>
              <span>Regional setting</span>
              <strong>{destination.region} India</strong>
            </div>
            <div>
              <span>Map stops</span>
              <strong>{destination.points.length} handpicked places</strong>
            </div>
            {foodSpots.length > 0 && (
              <div>
                <span>Famous food spots</span>
                <strong>{foodSpots.length} celebrated eateries</strong>
              </div>
            )}
          </aside>
        </div>

        <TripMap destination={destination} />
      </main>
    </div>
  );
}
