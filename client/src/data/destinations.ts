import { indiaCatalogue } from "./indiaCatalogue";

export type PointOfInterest = {
  id: string;
  name: string;
  category: "Attraction" | "Restaurant" | "Hotel" | "Activity" | "Hidden gem";
  description: string;
  planningCost: number;
  duration: string;
  coords: { lat: number; lng: number };
};

export type Destination = {
  id: string;
  name: string;
  state: string;
  region: "West" | "South" | "North" | "Central" | "East" | "North East";
  category: "Coast" | "Culture" | "Nature" | "City" | "Mountains";
  description: string;
  image: string;
  coords: { lat: number; lng: number };
  tags: string[];
  points: PointOfInterest[];
};

const images = {
  goa: "/images/goa.jpg",
  hyderabad: "/images/hyderabad.jpg",
  kerala: "/images/kerala.jpg",
  india: "/images/india.jpg",
};
export const destinations: Destination[] = [
  {
    id: "goa", name: "Goa", state: "Goa", region: "West", category: "Coast", image: images.goa,
    description: "Slow beach mornings, Portuguese-era lanes and sunset-facing tables along India’s western coast.",
    coords: { lat: 15.4909, lng: 73.8278 }, tags: ["beaches", "food", "nightlife", "adventure"],
    points: [
      { id: "baga", name: "Baga Beach", category: "Attraction", description: "A lively shoreline for a first-day coastal walk and water-sport planning.", planningCost: 700, duration: "2–3 hours", coords: { lat: 15.5553, lng: 73.7517 } },
      { id: "aguada", name: "Fort Aguada", category: "Attraction", description: "A sea-facing fort stop with expansive coastal views.", planningCost: 100, duration: "1–2 hours", coords: { lat: 15.4922, lng: 73.7736 } },
      { id: "anjuna", name: "Anjuna Cliffs", category: "Activity", description: "A relaxed cliffside route for browsing, sunsets and music venues.", planningCost: 600, duration: "2 hours", coords: { lat: 15.5731, lng: 73.7402 } },
      { id: "panjim", name: "Fontainhas Walk", category: "Hidden gem", description: "A self-guided heritage stroll through Panjim’s colourful Latin Quarter.", planningCost: 250, duration: "90 minutes", coords: { lat: 15.4982, lng: 73.8270 } },
    ],
  },
  {
    id: "hyderabad", name: "Hyderabad", state: "Telangana", region: "South", category: "Culture", image: images.hyderabad,
    description: "A layered city of palaces, bazaars and Deccani flavours where historic monuments meet a contemporary skyline.",
    coords: { lat: 17.385, lng: 78.4867 }, tags: ["history", "culture", "food", "city"],
    points: [
      { id: "charminar", name: "Charminar", category: "Attraction", description: "A landmark starting point for an Old City heritage circuit.", planningCost: 150, duration: "1 hour", coords: { lat: 17.3616, lng: 78.4747 } },
      { id: "golconda", name: "Golconda Fort", category: "Attraction", description: "A hilltop fort complex best planned as a longer morning visit.", planningCost: 400, duration: "3–4 hours", coords: { lat: 17.3833, lng: 78.4011 } },
      { id: "hussain", name: "Hussain Sagar", category: "Activity", description: "A lakeside pause with evening viewpoints and promenade space.", planningCost: 300, duration: "1–2 hours", coords: { lat: 17.4239, lng: 78.4738 } },
      { id: "chowmahalla", name: "Chowmahalla Palace", category: "Hidden gem", description: "Courtyards and ceremonial rooms that add a palace chapter to a cultural day.", planningCost: 250, duration: "90 minutes", coords: { lat: 17.3578, lng: 78.4718 } },
    ],
  },
  {
    id: "kerala", name: "Kerala", state: "Kerala", region: "South", category: "Nature", image: images.kerala,
    description: "Backwater rhythms, tea-covered slopes and coastal kitchens connected by scenic, unhurried routes.",
    coords: { lat: 9.9312, lng: 76.2673 }, tags: ["nature", "relaxation", "food", "family"],
    points: [
      { id: "fortkochi", name: "Fort Kochi Shoreline", category: "Attraction", description: "A waterfront walk with fishing nets, galleries and layered colonial architecture.", planningCost: 200, duration: "2 hours", coords: { lat: 9.9658, lng: 76.2425 } },
      { id: "munnar", name: "Munnar Tea Country", category: "Activity", description: "A highland day outing through tea slopes and misty viewpoints.", planningCost: 1100, duration: "Full day", coords: { lat: 10.0889, lng: 77.0595 } },
      { id: "alappuzha", name: "Alappuzha Backwaters", category: "Activity", description: "A calm waterway route suited to a houseboat or canoe-led afternoon.", planningCost: 1800, duration: "Half day", coords: { lat: 9.4981, lng: 76.3388 } },
    ],
  },
  {
    id: "jaipur", name: "Jaipur", state: "Rajasthan", region: "North", category: "Culture", image: images.india,
    description: "A craft-rich royal city shaped by pink facades, observatories and hilltop forts.", coords: { lat: 26.9124, lng: 75.7873 }, tags: ["history", "culture", "shopping", "photography"],
    points: [
      { id: "amber", name: "Amber Fort", category: "Attraction", description: "An early-start fort visit with hill views and expansive courtyards.", planningCost: 550, duration: "3 hours", coords: { lat: 26.9855, lng: 75.8513 } },
      { id: "hawa", name: "Hawa Mahal", category: "Attraction", description: "An iconic street-facing facade best paired with a walled-city walk.", planningCost: 200, duration: "1 hour", coords: { lat: 26.9239, lng: 75.8267 } },
    ],
  },
  {
    id: "manali", name: "Manali", state: "Himachal Pradesh", region: "North", category: "Mountains", image: images.india,
    description: "A mountain base for pine-scented trails, riverside rests and high-altitude adventure planning.", coords: { lat: 32.2396, lng: 77.1887 }, tags: ["adventure", "nature", "photography", "relaxation"],
    points: [
      { id: "hadimba", name: "Hadimba Temple", category: "Attraction", description: "A cedar-forest landmark close to Manali town.", planningCost: 100, duration: "1 hour", coords: { lat: 32.2432, lng: 77.1892 } },
      { id: "solang", name: "Solang Valley", category: "Activity", description: "An all-season activity valley for scenic rides and mountain sports.", planningCost: 1500, duration: "Half day", coords: { lat: 32.3132, lng: 77.1552 } },
    ],
  },
  {
    id: "mumbai", name: "Mumbai", state: "Maharashtra", region: "West", category: "City", image: images.india,
    description: "A waterfront metropolis for art-deco walks, late-night dining and cinematic city energy.", coords: { lat: 19.076, lng: 72.8777 }, tags: ["city", "food", "shopping", "nightlife"],
    points: [{ id: "gateway", name: "Gateway of India", category: "Attraction", description: "A harbourfront landmark for a short early-morning visit.", planningCost: 100, duration: "45 minutes", coords: { lat: 18.922, lng: 72.8347 } }],
  },
  {
    id: "delhi", name: "Delhi", state: "Delhi", region: "North", category: "City", image: images.india,
    description: "A capital of monumental history, contemporary galleries and distinct neighbourhood food trails.", coords: { lat: 28.6139, lng: 77.209 }, tags: ["history", "culture", "food", "shopping"],
    points: [{ id: "humayun", name: "Humayun’s Tomb", category: "Attraction", description: "A garden-tomb complex ideal for a thoughtful history stop.", planningCost: 300, duration: "90 minutes", coords: { lat: 28.5933, lng: 77.2507 } }],
  },
  {
    id: "bengaluru", name: "Bengaluru", state: "Karnataka", region: "South", category: "City", image: images.india,
    description: "Garden-lined avenues, design-minded cafés and an energetic contemporary culture.", coords: { lat: 12.9716, lng: 77.5946 }, tags: ["food", "city", "nightlife", "shopping"],
    points: [{ id: "cubbon", name: "Cubbon Park", category: "Attraction", description: "A central green pause between city museums and cafés.", planningCost: 100, duration: "1 hour", coords: { lat: 12.9763, lng: 77.5929 } }],
  },
  {
    id: "chennai", name: "Chennai", state: "Tamil Nadu", region: "South", category: "Coast", image: images.india,
    description: "A coastal cultural capital with long beach walks, temple heritage and strong regional cuisine.", coords: { lat: 13.0827, lng: 80.2707 }, tags: ["culture", "food", "beaches", "family"],
    points: [{ id: "marina", name: "Marina Beach", category: "Attraction", description: "A classic sunrise and promenade experience along the Bay of Bengal.", planningCost: 100, duration: "90 minutes", coords: { lat: 13.0499, lng: 80.2824 } }],
  },
  {
    id: "agra", name: "Agra", state: "Uttar Pradesh", region: "North", category: "Culture", image: images.india,
    description: "An essential Mughal chapter with river-view monuments and craft-rich old-city lanes.", coords: { lat: 27.1767, lng: 78.0081 }, tags: ["history", "culture", "photography", "family"],
    points: [{ id: "taj", name: "Taj Mahal", category: "Attraction", description: "A morning monument visit that anchors a heritage-focused day.", planningCost: 550, duration: "2–3 hours", coords: { lat: 27.1751, lng: 78.0421 } }],
  },
  ...indiaCatalogue,
];

export function getDestination(value: string | undefined) {
  const lookup = value?.toLowerCase().replace(/\s+/g, "-");
  return destinations.find(destination => destination.id === lookup || destination.name.toLowerCase() === value?.toLowerCase()) || destinations[0];
}
