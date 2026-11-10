import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getAvailableStopsForDestination,
  type StopCandidate,
} from "@/lib/destinationStops";
import type { ItineraryDay } from "@/contexts/TripContext";
import {
  Search,
  Plus,
  Compass,
  Utensils,
  Clock,
  IndianRupee,
  MapPin,
  Sparkles,
  Layers,
  X,
} from "lucide-react";

export type AddStopDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayNumber: number | null;
  destinationName: string;
  itinerary: ItineraryDay[];
  onAddStop: (dayNumber: number, candidate: StopCandidate) => void;
};

type FilterCategory = "all" | "attraction" | "food";

export function AddStopDialog({
  open,
  onOpenChange,
  dayNumber,
  destinationName,
  itinerary,
  onAddStop,
}: AddStopDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Custom stop form state for destinations with sparse catalogue data
  const [customTitle, setCustomTitle] = useState("");
  const [customType, setCustomType] = useState<"attraction" | "food">("attraction");
  const [customMealType, setCustomMealType] = useState<"breakfast" | "lunch" | "dinner">("lunch");
  const [candidateMealOverrides, setCandidateMealOverrides] = useState<Record<string, "breakfast" | "lunch" | "dinner">>({});
  const [customDesc, setCustomDesc] = useState("");
  const [customDuration, setCustomDuration] = useState("90 minutes");
  const [customCost, setCustomCost] = useState("0");

  const {
    destination,
    attractions,
    foodPlaces,
    allCandidates,
    totalCatalogueCount,
  } = useMemo(() => {
    return getAvailableStopsForDestination(destinationName, itinerary);
  }, [destinationName, itinerary]);

  // Filter candidates based on active category and search query
  const filteredCandidates = useMemo(() => {
    let list =
      activeCategory === "attraction"
        ? attractions
        : activeCategory === "food"
        ? foodPlaces
        : allCandidates;

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = item.description.toLowerCase().includes(query);
        const locMatch = item.location.toLowerCase().includes(query);
        const catMatch = item.category.toLowerCase().includes(query);
        const specMatch = item.specialties?.some(s => s.toLowerCase().includes(query));
        return titleMatch || descMatch || locMatch || catMatch || specMatch;
      });
    }

    return list;
  }, [activeCategory, attractions, foodPlaces, allCandidates, searchQuery]);

  const handleSelectCandidate = (candidate: StopCandidate) => {
    if (dayNumber === null) return;
    onAddStop(dayNumber, candidate);
    onOpenChange(false);
    setSearchQuery("");
    setShowCustomForm(false);
  };

  const handleAddCustomStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || dayNumber === null) return;

    // Center coords near destination with small random offset
    const jitterLat = (Math.random() - 0.5) * 0.015;
    const jitterLng = (Math.random() - 0.5) * 0.015;
    const coords = {
      lat: (destination?.coords?.lat || 20.5937) + jitterLat,
      lng: (destination?.coords?.lng || 78.9629) + jitterLng,
    };

    const customCandidate: StopCandidate = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      category: customType === "food" ? (customMealType === "breakfast" ? "Breakfast" : customMealType === "dinner" ? "Dinner" : "Lunch") : "Sightseeing",
      stopType: customType,
      mealType: customType === "food" ? customMealType : undefined,
      location: `${destination.name}, ${destination.state}`,
      description:
        customDesc.trim() ||
        (customType === "food"
          ? `Authentic culinary experience in ${destination.name}.`
          : `Scenic sight and landmark in ${destination.name}.`),
      duration: customDuration,
      estimatedCost: parseInt(customCost, 10) || 0,
      coords,
      source: "custom",
    };

    onAddStop(dayNumber, customCandidate);
    onOpenChange(false);
    setCustomTitle("");
    setCustomDesc("");
    setShowCustomForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          background: "linear-gradient(180deg, #06231d 0%, #031713 100%)",
          border: "1px solid rgba(45, 212, 191, 0.25)",
          color: "#f0fdf4",
          maxWidth: "680px",
          width: "92vw",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
        }}
      >
        <DialogHeader style={{ paddingBottom: "12px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(45, 212, 191, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2dd4bf",
                }}
              >
                <Plus size={18} />
              </div>
              <DialogTitle style={{ color: "#f0fdf4", fontSize: "19px", fontWeight: 600 }}>
                Add Stop to Day {dayNumber}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
            Select an attraction or local food venue in <strong>{destination.name}</strong>. Stops already scheduled in your itinerary are hidden to prevent duplicates.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar & Category Filter Tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "10px",
              padding: "0 12px",
            }}
          >
            <Search size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name, cuisine, specialty, or area..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#f0fdf4",
                padding: "10px 10px",
                fontSize: "14px",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("all");
                setShowCustomForm(false);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 500,
                border: "1px solid",
                cursor: "pointer",
                background:
                  activeCategory === "all" && !showCustomForm
                    ? "rgba(45, 212, 191, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                borderColor:
                  activeCategory === "all" && !showCustomForm
                    ? "rgba(45, 212, 191, 0.4)"
                    : "rgba(255, 255, 255, 0.1)",
                color: activeCategory === "all" && !showCustomForm ? "#a5f3fc" : "#94a3b8",
                transition: "all 0.15s ease",
              }}
            >
              <Layers size={13} />
              <span>All ({allCandidates.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory("attraction");
                setShowCustomForm(false);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 500,
                border: "1px solid",
                cursor: "pointer",
                background:
                  activeCategory === "attraction" && !showCustomForm
                    ? "rgba(45, 212, 191, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                borderColor:
                  activeCategory === "attraction" && !showCustomForm
                    ? "rgba(45, 212, 191, 0.4)"
                    : "rgba(255, 255, 255, 0.1)",
                color: activeCategory === "attraction" && !showCustomForm ? "#a5f3fc" : "#94a3b8",
                transition: "all 0.15s ease",
              }}
            >
              <Compass size={13} />
              <span>Attractions ({attractions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveCategory("food");
                setShowCustomForm(false);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 500,
                border: "1px solid",
                cursor: "pointer",
                background:
                  activeCategory === "food" && !showCustomForm
                    ? "rgba(245, 158, 11, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                borderColor:
                  activeCategory === "food" && !showCustomForm
                    ? "rgba(245, 158, 11, 0.4)"
                    : "rgba(255, 255, 255, 0.1)",
                color: activeCategory === "food" && !showCustomForm ? "#fcd34d" : "#94a3b8",
                transition: "all 0.15s ease",
              }}
            >
              <Utensils size={13} />
              <span>Food & Dining ({foodPlaces.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomForm(prev => !prev)}
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 500,
                border: "1px dashed",
                cursor: "pointer",
                background: showCustomForm ? "rgba(99, 102, 241, 0.2)" : "transparent",
                borderColor: showCustomForm ? "rgba(129, 140, 248, 0.5)" : "rgba(255, 255, 255, 0.2)",
                color: showCustomForm ? "#c7d2fe" : "#94a3b8",
                transition: "all 0.15s ease",
              }}
            >
              <Sparkles size={12} />
              <span>{showCustomForm ? "Browse Catalogue" : "Custom Stop"}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginTop: "16px",
            paddingRight: "4px",
            maxHeight: "50vh",
          }}
        >
          {showCustomForm ? (
            /* Custom Stop Form */
            <form onSubmit={handleAddCustomStop} style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "12px" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#f0fdf4", marginBottom: "4px" }}>
                  Add a Custom Place or Activity
                </h4>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "14px" }}>
                  Add your own favorite hidden gem, café, or bespoke experience in {destination.name}.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                      Place / Attraction Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fisherman's Cove Sunset Café"
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "8px",
                        color: "#f0fdf4",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                        Category
                      </label>
                      <select
                        value={customType}
                        onChange={e => setCustomType(e.target.value as "attraction" | "food")}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "#06231d",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "8px",
                          color: "#f0fdf4",
                          fontSize: "13px",
                        }}
                      >
                        <option value="attraction">Attraction / Sight</option>
                        <option value="food">Restaurant / Food Stop</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                        Visit Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 90 minutes"
                        value={customDuration}
                        onChange={e => setCustomDuration(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "rgba(0, 0, 0, 0.3)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "8px",
                          color: "#f0fdf4",
                          fontSize: "13px",
                        }}
                      />
                    </div>
                  </div>

                  {customType === "food" && (
                    <div>
                      <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                        Meal Slot
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {(["breakfast", "lunch", "dinner"] as const).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setCustomMealType(m)}
                            style={{
                              flex: 1,
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "1px solid",
                              fontSize: "12px",
                              fontWeight: customMealType === m ? 700 : 500,
                              cursor: "pointer",
                              background:
                                customMealType === m
                                  ? m === "breakfast"
                                    ? "rgba(245, 158, 11, 0.3)"
                                    : m === "lunch"
                                    ? "rgba(234, 88, 12, 0.3)"
                                    : "rgba(168, 85, 247, 0.3)"
                                  : "rgba(255, 255, 255, 0.05)",
                              borderColor:
                                customMealType === m
                                  ? m === "breakfast"
                                    ? "#f59e0b"
                                    : m === "lunch"
                                    ? "#ea580c"
                                    : "#a855f7"
                                  : "rgba(255, 255, 255, 0.12)",
                              color: customMealType === m ? "#ffffff" : "#94a3b8",
                              textTransform: "capitalize",
                            }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief note about the spot, scenic view, or specialties..."
                      value={customDesc}
                      onChange={e => setCustomDesc(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "8px",
                        color: "#f0fdf4",
                        fontSize: "13px",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                      Estimated Cost (₹ per person)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={customCost}
                      onChange={e => setCustomCost(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "rgba(0, 0, 0, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "8px",
                        color: "#f0fdf4",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    style={{
                      padding: "8px 16px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "8px",
                      color: "#f0fdf4",
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!customTitle.trim()}
                    style={{
                      padding: "8px 18px",
                      background: "#0d9488",
                      border: "none",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: customTitle.trim() ? "pointer" : "not-allowed",
                      opacity: customTitle.trim() ? 1 : 0.6,
                    }}
                  >
                    Add Custom Stop
                  </button>
                </div>
              </div>
            </form>
          ) : filteredCandidates.length === 0 ? (
            /* Empty State */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "36px 20px",
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "12px",
                border: "1px dashed rgba(255, 255, 255, 0.1)",
              }}
            >
              {searchQuery ? (
                <>
                  <Search size={28} style={{ color: "#64748b", marginBottom: "10px" }} />
                  <p style={{ color: "#f0fdf4", fontWeight: 500, fontSize: "14px", marginBottom: "4px" }}>
                    No stops matching "{searchQuery}"
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "14px" }}>
                    Try searching with broader terms or check the other category tab.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      padding: "6px 14px",
                      background: "rgba(45, 212, 191, 0.15)",
                      border: "1px solid rgba(45, 212, 191, 0.3)",
                      borderRadius: "6px",
                      color: "#2dd4bf",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Clear search
                  </button>
                </>
              ) : allCandidates.length === 0 ? (
                <>
                  <Sparkles size={28} style={{ color: "#2dd4bf", marginBottom: "10px" }} />
                  <p style={{ color: "#f0fdf4", fontWeight: 500, fontSize: "14px", marginBottom: "4px" }}>
                    {totalCatalogueCount > 0
                      ? `All available spots for ${destination.name} are already in your trip!`
                      : `Incomplete catalogue data for ${destination.name}`}
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: "12px", maxWidth: "380px", marginBottom: "14px" }}>
                    {totalCatalogueCount > 0
                      ? "Every catalogued attraction and restaurant is currently scheduled. You can rearrange stops or add a custom place."
                      : `We don't have additional pre-listed spots for ${destination.name} yet, but you can add your own custom spots anytime.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 16px",
                      background: "#0d9488",
                      border: "none",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} />
                    Add a Custom Stop
                  </button>
                </>
              ) : (
                <>
                  <Compass size={28} style={{ color: "#64748b", marginBottom: "10px" }} />
                  <p style={{ color: "#f0fdf4", fontWeight: 500, fontSize: "14px", marginBottom: "4px" }}>
                    No unscheduled stops in this category
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "14px" }}>
                    Check the "All" tab or add a custom spot.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    style={{
                      padding: "6px 14px",
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "6px",
                      color: "#f0fdf4",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    View All Stops
                  </button>
                </>
              )}
            </div>
          ) : (
            /* List of Candidate Cards */
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredCandidates.map(candidate => {
                const isFood = candidate.stopType === "food";
                return (
                  <div
                    key={candidate.id}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      transition: "border-color 0.15s ease, background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          {/* Type Badge */}
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background: isFood ? "rgba(245, 158, 11, 0.15)" : "rgba(45, 212, 191, 0.15)",
                              color: isFood ? "#fbbf24" : "#2dd4bf",
                            }}
                          >
                            {isFood ? <Utensils size={11} /> : <Compass size={11} />}
                            {isFood ? "Food & Dining" : "Attraction"}
                          </span>

                          {/* Subcategory */}
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              background: "rgba(255, 255, 255, 0.06)",
                              color: "#cbd5e1",
                            }}
                          >
                            {candidate.category}
                          </span>

                          {/* Duration Badge */}
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              fontSize: "11px",
                              color: "#94a3b8",
                            }}
                          >
                            <Clock size={11} />
                            {candidate.duration}
                          </span>

                          {/* Cost / Price Range */}
                          {candidate.estimatedCost > 0 ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                                fontSize: "11px",
                                color: "#94a3b8",
                              }}
                            >
                              <IndianRupee size={10} />
                              {candidate.estimatedCost}
                            </span>
                          ) : candidate.priceRange ? (
                            <span style={{ fontSize: "11px", color: "#fbbf24" }}>
                              {candidate.priceRange}
                            </span>
                          ) : null}
                        </div>

                        {/* Title */}
                        <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#f0fdf4", margin: "2px 0 4px" }}>
                          {candidate.title}
                        </h4>

                        {/* Location */}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                          <MapPin size={11} style={{ flexShrink: 0 }} />
                          <span>{candidate.location}</span>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.45, margin: 0 }}>
                          {candidate.description}
                        </p>

                        {/* Food Specialties & Meal Slot Selector */}
                        {isFood && (
                          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            {candidate.specialties && candidate.specialties.length > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "11px", color: "#fcd34d", fontWeight: 500 }}>Specialties:</span>
                                {candidate.specialties.map((spec, sIdx) => (
                                  <span
                                    key={sIdx}
                                    style={{
                                      fontSize: "11px",
                                      padding: "1px 7px",
                                      borderRadius: "4px",
                                      background: "rgba(245, 158, 11, 0.1)",
                                      border: "1px solid rgba(245, 158, 11, 0.2)",
                                      color: "#fde68a",
                                    }}
                                  >
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Schedule as:</span>
                              <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.3)", borderRadius: "6px", padding: "1px", border: "1px solid rgba(255,255,255,0.08)" }}>
                                {(["breakfast", "lunch", "dinner"] as const).map(m => {
                                  const currentMeal = candidateMealOverrides[candidate.id] || candidate.mealType || "lunch";
                                  const active = currentMeal === m;
                                  return (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        setCandidateMealOverrides(prev => ({ ...prev, [candidate.id]: m }));
                                      }}
                                      style={{
                                        padding: "2px 8px",
                                        fontSize: "10px",
                                        fontWeight: active ? 700 : 500,
                                        borderRadius: "5px",
                                        border: "none",
                                        cursor: "pointer",
                                        background: active
                                          ? m === "breakfast" ? "#d97706" : m === "lunch" ? "#ea580c" : "#9333ea"
                                          : "transparent",
                                        color: active ? "#ffffff" : "#94a3b8",
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {m}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const chosenMeal = isFood ? (candidateMealOverrides[candidate.id] || candidate.mealType || "lunch") : undefined;
                          handleSelectCandidate({
                            ...candidate,
                            mealType: chosenMeal,
                          });
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          background: "#0d9488",
                          border: "none",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          flexShrink: 0,
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#0f766e")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#0d9488")}
                      >
                        <Plus size={13} />
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
