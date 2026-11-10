import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Building2,
  Check,
  Coffee,
  ExternalLink,
  Filter,
  Hotel,
  IndianRupee,
  Layers,
  MapPin,
  Moon,
  Plus,
  Search,
  Sparkles,
  Star,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  getAccommodationsForDestination,
  type AccommodationItem,
  type AccommodationSelection,
  type AccommodationType,
} from "@/data/accommodations";
import { formatINR } from "@/lib/tripMath";

export interface AccommodationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinationId: string;
  destinationName: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  travelers?: number;
  currentAccommodation?: AccommodationSelection | null;
  onSelectAccommodation: (selection: AccommodationSelection) => void;
}

export function AccommodationDialog({
  open,
  onOpenChange,
  destinationId,
  destinationName,
  startDate = "",
  endDate = "",
  days = 3,
  travelers = 2,
  currentAccommodation,
  onSelectAccommodation,
}: AccommodationDialogProps) {
  const [activeTab, setActiveTab] = useState<"catalogue" | "custom">("catalogue");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");

  // Selection configurations
  const [selectedItem, setSelectedItem] = useState<AccommodationItem | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");
  const [roomCount, setRoomCount] = useState<number>(Math.max(1, Math.ceil(travelers / 2)));
  const [guestCount, setGuestCount] = useState<number>(travelers || 2);
  const [checkIn, setCheckIn] = useState<string>(startDate);
  const [checkOut, setCheckOut] = useState<string>(endDate);

  // Custom stay form
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<AccommodationType>("Hotel");
  const [customAddress, setCustomAddress] = useState("");
  const [customPricePerNight, setCustomPricePerNight] = useState("4500");
  const [customRoomType, setCustomRoomType] = useState("Deluxe Room");
  const [customBookingUrl, setCustomBookingUrl] = useState("");
  const [customBreakfastIncluded, setCustomBreakfastIncluded] = useState(true);
  const [customAmenities, setCustomAmenities] = useState("Free WiFi, Air conditioning, Daily housekeeping");

  const nightsCount = useMemo(() => {
    if (checkIn && checkOut) {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (!isNaN(diffDays) && diffDays > 0) return diffDays;
    }
    return Math.max(1, days - 1 || 1);
  }, [checkIn, checkOut, days]);

  const curatedList = useMemo(() => {
    return getAccommodationsForDestination(destinationId);
  }, [destinationId]);

  useEffect(() => {
    if (open) {
      setCheckIn(startDate);
      setCheckOut(endDate);
      setRoomCount(Math.max(1, Math.ceil(travelers / 2)));
      setGuestCount(travelers || 2);
      if (currentAccommodation) {
        if (currentAccommodation.source === "custom") {
          setActiveTab("custom");
          setCustomName(currentAccommodation.name);
          setCustomType(currentAccommodation.type);
          setCustomAddress(currentAccommodation.address);
          setCustomPricePerNight(String(currentAccommodation.pricePerNight));
          setCustomRoomType(currentAccommodation.roomType);
          setCustomBookingUrl(currentAccommodation.bookingUrl || "");
          setCustomBreakfastIncluded(Boolean(currentAccommodation.isBreakfastIncluded));
        } else {
          setActiveTab("catalogue");
          const match = curatedList.find(a => a.id === currentAccommodation.id);
          if (match) {
            setSelectedItem(match);
            setSelectedRoomType(currentAccommodation.roomType || match.roomTypes[0] || "Standard Room");
          }
        }
      } else if (curatedList.length > 0) {
        setSelectedItem(curatedList[0]!);
        setSelectedRoomType(curatedList[0]!.roomTypes[0] || "Standard Room");
      }
    }
  }, [open, destinationId, startDate, endDate, travelers, currentAccommodation, curatedList]);

  const filteredCatalogue = useMemo(() => {
    return curatedList.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      const matchTier = selectedTier === "All" || item.tier.toLowerCase() === selectedTier.toLowerCase();
      const matchType = selectedType === "All" || item.type.toLowerCase() === selectedType.toLowerCase();
      return matchQuery && matchTier && matchType;
    });
  }, [curatedList, searchQuery, selectedTier, selectedType]);

  const handleSelectCatalogue = () => {
    if (!selectedItem) return;
    const pricePerNight = selectedItem.pricePerNight;
    const totalCost = pricePerNight * nightsCount * roomCount;

    const selection: AccommodationSelection = {
      id: selectedItem.id,
      name: selectedItem.name,
      type: selectedItem.type,
      destinationId: selectedItem.destinationId,
      address: selectedItem.address,
      coords: selectedItem.coords,
      checkIn: checkIn || startDate,
      checkOut: checkOut || endDate,
      nights: nightsCount,
      roomType: selectedRoomType || selectedItem.roomTypes[0] || "Standard Room",
      roomCount,
      guestCount,
      pricePerNight,
      totalCost,
      amenities: selectedItem.amenities,
      bookingUrl: selectedItem.bookingUrl,
      source: "catalogue",
      isBreakfastIncluded: selectedItem.isBreakfastIncluded,
    };

    onSelectAccommodation(selection);
    onOpenChange(false);
  };

  const handleSelectCustom = () => {
    if (!customName.trim()) return;
    const p = Math.max(0, parseInt(customPricePerNight, 10) || 3000);
    const totalCost = p * nightsCount * roomCount;
    const amenitiesArr = customAmenities
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const selection: AccommodationSelection = {
      id: `custom-stay-${Date.now()}`,
      name: customName.trim(),
      type: customType,
      destinationId,
      address: customAddress.trim() || `${destinationName}, India`,
      coords: selectedItem?.coords || { lat: 0, lng: 0 },
      checkIn: checkIn || startDate,
      checkOut: checkOut || endDate,
      nights: nightsCount,
      roomType: customRoomType.trim() || "Standard Room",
      roomCount,
      guestCount,
      pricePerNight: p,
      totalCost,
      amenities: amenitiesArr,
      bookingUrl: customBookingUrl.trim() || undefined,
      source: "custom",
      isBreakfastIncluded: customBreakfastIncluded,
    };

    onSelectAccommodation(selection);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          background: "#08221e",
          border: "1px solid rgba(45, 212, 191, 0.25)",
          color: "#f8fafc",
          maxWidth: "880px",
          width: "95vw",
          maxHeight: "90vh",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <DialogHeader
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <DialogTitle style={{ fontSize: "20px", fontWeight: 700, color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
                <Hotel size={22} style={{ color: "#2dd4bf" }} />
                Accommodation Planning · {destinationName}
              </DialogTitle>
              <DialogDescription style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
                Choose a curated heritage hotel, luxury resort or boutique stay for your {days}-day trip, or enter your custom booking.
              </DialogDescription>
            </div>
            <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.06)", borderRadius: "8px", padding: "3px" }}>
              <button
                type="button"
                onClick={() => setActiveTab("catalogue")}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === "catalogue" ? "#0d7a68" : "transparent",
                  color: activeTab === "catalogue" ? "#ffffff" : "#94a3b8",
                  transition: "all 0.15s ease",
                }}
              >
                Curated Stays ({curatedList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === "custom" ? "#0d7a68" : "transparent",
                  color: activeTab === "custom" ? "#ffffff" : "#94a3b8",
                  transition: "all 0.15s ease",
                }}
              >
                Custom Booking
              </button>
            </div>
          </div>
        </DialogHeader>

        {activeTab === "catalogue" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", overflow: "hidden", flex: 1, minHeight: 0 }}>
            {/* Left Column: Search & List */}
            <div style={{ borderRight: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ position: "relative" }}>
                  <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by hotel name or location..."
                    style={{
                      width: "100%",
                      padding: "8px 10px 8px 32px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {(["All", "Luxury", "Premium", "Moderate"] as const).map(tier => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setSelectedTier(tier)}
                        style={{
                          fontSize: "11px",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: selectedTier === tier ? "1px solid #2dd4bf" : "1px solid rgba(255, 255, 255, 0.1)",
                          background: selectedTier === tier ? "rgba(45, 212, 191, 0.15)" : "transparent",
                          color: selectedTier === tier ? "#5eead4" : "#94a3b8",
                          cursor: "pointer",
                        }}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {filteredCatalogue.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                    <p style={{ fontSize: "14px", fontWeight: 500 }}>No stays match your search.</p>
                    <p style={{ fontSize: "12px", marginTop: "4px" }}>Try adjusting your filters or use the "Custom Booking" tab.</p>
                  </div>
                ) : (
                  filteredCatalogue.map(item => {
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item);
                          if (!item.roomTypes.includes(selectedRoomType)) {
                            setSelectedRoomType(item.roomTypes[0] || "Standard Room");
                          }
                        }}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "10px",
                          background: isSelected ? "rgba(45, 212, 191, 0.12)" : "rgba(255, 255, 255, 0.03)",
                          border: isSelected ? "1.5px solid #2dd4bf" : "1px solid rgba(255, 255, 255, 0.08)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <strong style={{ fontSize: "14px", color: isSelected ? "#5eead4" : "#f8fafc" }}>
                                {item.name}
                              </strong>
                              <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 5px", borderRadius: "4px", background: item.tier === "Luxury" ? "rgba(245, 158, 11, 0.2)" : "rgba(45, 212, 191, 0.15)", color: item.tier === "Luxury" ? "#fbbf24" : "#5eead4" }}>
                                {item.tier}
                              </span>
                            </div>
                            <small style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px", fontSize: "11px" }}>
                              <MapPin size={11} /> {item.city} · {item.type}
                            </small>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
                              {formatINR(item.pricePerNight)}
                            </span>
                            <small style={{ display: "block", color: "#64748b", fontSize: "10px" }}>/ night</small>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", fontSize: "11px", color: "#94a3b8" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#fbbf24" }}>
                            <Star size={11} fill="#fbbf24" /> {item.rating}
                          </span>
                          {item.isBreakfastIncluded && (
                            <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#86efac" }}>
                              <Coffee size={11} /> Breakfast included
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Configuration & Confirm */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
              {selectedItem ? (
                <>
                  <div style={{ paddingBottom: "16px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#2dd4bf", fontWeight: 700, letterSpacing: "0.5px" }}>
                      Selected Stay
                    </span>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#f8fafc", margin: "4px 0" }}>
                      {selectedItem.name}
                    </h3>
                    <p style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={12} /> {selectedItem.address}
                    </p>
                    <p style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "8px", lineHeight: "1.4" }}>
                      {selectedItem.description}
                    </p>
                  </div>

                  <div style={{ margin: "16px 0", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                        Select Room Category
                      </label>
                      <select
                        value={selectedRoomType}
                        onChange={e => setSelectedRoomType(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "8px",
                          color: "#f8fafc",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      >
                        {selectedItem.roomTypes.map(rt => (
                          <option key={rt} value={rt} style={{ background: "#061b17", color: "#f8fafc" }}>
                            {rt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                          Number of Rooms
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={roomCount}
                          onChange={e => setRoomCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "6px",
                            color: "#f8fafc",
                            fontSize: "13px",
                            outline: "none",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "11px", color: "#94a3b8", marginBottom: "4px" }}>
                          Guests
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={guestCount}
                          onChange={e => setGuestCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "6px",
                            color: "#f8fafc",
                            fontSize: "13px",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Amenities & Perks</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px" }}>
                        {selectedItem.amenities.map(am => (
                          <span
                            key={am}
                            style={{
                              fontSize: "10px",
                              padding: "2px 7px",
                              borderRadius: "4px",
                              background: "rgba(45, 212, 191, 0.1)",
                              color: "#a5f3fc",
                              border: "1px solid rgba(45, 212, 191, 0.2)",
                            }}
                          >
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>

                    {selectedItem.isBreakfastIncluded && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)", borderRadius: "8px", color: "#86efac", fontSize: "12px" }}>
                        <Coffee size={15} />
                        <span>Breakfast included daily. TripWise will automatically adjust morning meal plans so you don't pay double.</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing summary & action */}
                  <div style={{ paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", marginTop: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                      <div>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Total Stay for {nightsCount} nights</span>
                        <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#2dd4bf", margin: 0 }}>
                          {formatINR(selectedItem.pricePerNight * nightsCount * roomCount)}
                        </h4>
                      </div>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {formatINR(selectedItem.pricePerNight)} × {nightsCount} nights × {roomCount} room(s)
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      {selectedItem.bookingUrl && (
                        <a
                          href={selectedItem.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "9px 14px",
                            borderRadius: "8px",
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            color: "#f8fafc",
                            fontSize: "12px",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={13} /> View Website
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleSelectCatalogue}
                        style={{
                          flex: 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 16px",
                          borderRadius: "8px",
                          background: "#0d7a68",
                          border: "none",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <Check size={16} /> Confirm & Save Stay
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          /* Custom Stay Tab */
          <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
              Already have a hotel, Airbnb or homestay booked? Enter your details below to integrate it seamlessly into your itinerary routes and budget.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                  Hotel / Property Name *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. W Goa Beach Resort or Airbnb Panjim Villa"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                  Stay Type
                </label>
                <select
                  value={customType}
                  onChange={e => setCustomType(e.target.value as AccommodationType)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "13px",
                  }}
                >
                  {(["Hotel", "Resort", "Heritage Palace", "Homestay", "Boutique Stay", "Guesthouse"] as const).map(t => (
                    <option key={t} value={t} style={{ background: "#061b17" }}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                Property Address / Area
              </label>
              <input
                type="text"
                value={customAddress}
                onChange={e => setCustomAddress(e.target.value)}
                placeholder="e.g. Vagator Beach Road, North Goa"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "13px",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                  Price per Night (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={customPricePerNight}
                  onChange={e => setCustomPricePerNight(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                  Rooms
                </label>
                <input
                  type="number"
                  min={1}
                  value={roomCount}
                  onChange={e => setRoomCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                  Room / Unit Type
                </label>
                <input
                  type="text"
                  value={customRoomType}
                  onChange={e => setCustomRoomType(e.target.value)}
                  placeholder="e.g. Ocean Suite"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "4px" }}>
                  Booking URL or Confirmation Reference
                </label>
                <input
                  type="text"
                  value={customBookingUrl}
                  onChange={e => setCustomBookingUrl(e.target.value)}
                  placeholder="https://..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", marginTop: "24px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={customBreakfastIncluded}
                    onChange={e => setCustomBreakfastIncluded(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#2dd4bf" }}
                  />
                  <span>Breakfast included with stay</span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", marginTop: "10px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Total calculated stay ({nightsCount} nights):</span>
                <span style={{ display: "block", fontSize: "18px", fontWeight: 700, color: "#2dd4bf" }}>
                  {formatINR((parseInt(customPricePerNight, 10) || 0) * nightsCount * roomCount)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSelectCustom}
                disabled={!customName.trim()}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: customName.trim() ? "#0d7a68" : "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: customName.trim() ? "#ffffff" : "#64748b",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: customName.trim() ? "pointer" : "not-allowed",
                }}
              >
                Save Custom Stay
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
