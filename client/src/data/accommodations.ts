export type AccommodationType =
  | "Hotel"
  | "Resort"
  | "Homestay"
  | "Guesthouse"
  | "Heritage Palace"
  | "Boutique Stay";

export type AccommodationItem = {
  id: string;
  name: string;
  destinationId: string;
  city: string;
  type: AccommodationType;
  tier: "Budget" | "Moderate" | "Premium" | "Luxury";
  address: string;
  coords: { lat: number; lng: number };
  pricePerNight: number;
  rating: number;
  roomTypes: string[];
  amenities: string[];
  description: string;
  isBreakfastIncluded: boolean;
  bookingUrl?: string;
};

export type AccommodationSelection = {
  id: string;
  name: string;
  type: AccommodationType;
  destinationId?: string;
  address: string;
  coords: { lat: number; lng: number };
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  roomCount: number;
  guestCount: number;
  pricePerNight: number;
  totalCost: number;
  amenities: string[];
  bookingUrl?: string;
  source: "catalogue" | "custom" | "verified";
  isBreakfastIncluded?: boolean;
};

export const accommodations: AccommodationItem[] = [
  // ==================== GOA ====================
  {
    id: "goa-taj-exotica",
    name: "Taj Exotica Resort & Spa",
    destinationId: "goa",
    city: "Benaulim, South Goa",
    type: "Resort",
    tier: "Luxury",
    address: "Calvaddo, Benaulim, Salcete, Goa 403716",
    coords: { lat: 15.2530, lng: 73.9210 },
    pricePerNight: 24000,
    rating: 4.8,
    roomTypes: ["Deluxe Sea View Villa", "Luxury Room Garden View", "Presidential Villa with Private Pool"],
    amenities: ["Breakfast included", "Private beach access", "Jiva Spa", "Golf course", "Free high-speed WiFi", "Fine dining restaurants"],
    description: "Mediterranean-style luxury beachfront sanctuary sprawled across 56 acres along serene Benaulim beach in South Goa.",
    isBreakfastIncluded: true,
    bookingUrl: "https://www.tajhotels.com",
  },
  {
    id: "goa-alila-diwa",
    name: "Alila Diwa Goa",
    destinationId: "goa",
    city: "Majorda, South Goa",
    type: "Resort",
    tier: "Premium",
    address: "48/10, Adao Waddo, Majorda, Goa 403713",
    coords: { lat: 15.3120, lng: 73.9110 },
    pricePerNight: 12500,
    rating: 4.7,
    roomTypes: ["Terrace Room", "Family Suite", "Diwa Club Room"],
    amenities: ["Breakfast included", "Infinity pool over paddy fields", "Spa Alila", "Free shuttle to Majorda beach", "Free WiFi"],
    description: "Serene resort blending traditional Goan architecture with contemporary luxury, overlooking lush paddy fields in Majorda.",
    isBreakfastIncluded: true,
    bookingUrl: "https://www.hyatt.com",
  },
  {
    id: "goa-panjim-heritage-inn",
    name: "Panjim Heritage Latin Quarter Villa",
    destinationId: "goa",
    city: "Fontainhas, Panaji, Central Goa",
    type: "Heritage Palace",
    tier: "Moderate",
    address: "E-212, 31st January Road, Fontainhas, Panaji, Goa 403001",
    coords: { lat: 15.4980, lng: 73.8270 },
    pricePerNight: 5500,
    rating: 4.6,
    roomTypes: ["Portuguese Balcony Room", "Heritage Suite", "Courtyard Deluxe"],
    amenities: ["Breakfast included", "Historical Portuguese architecture", "Courtyard garden", "Walking tours", "Air conditioning"],
    description: "Characterful 19th-century Portuguese ancestral townhouse nestled inside the cobblestone lanes of heritage Fontainhas.",
    isBreakfastIncluded: true,
  },
  {
    id: "goa-w-hotel",
    name: "W Goa Beachfront",
    destinationId: "goa",
    city: "Vagator, North Goa",
    type: "Resort",
    tier: "Luxury",
    address: "Vagator Beach, Bardez, Goa 403509",
    coords: { lat: 15.6025, lng: 73.7385 },
    pricePerNight: 21000,
    rating: 4.7,
    roomTypes: ["Wonderful Room", "Fabulous Villa", "WOW Ocean Suite"],
    amenities: ["Breakfast included", "Rock pool sunset deck", "AWAY Spa", "Direct beach access", "High-energy beach lounge"],
    description: "Glamorous beachfront sanctuary set against dramatic red cliffs and Vagator beach, renowned for sunset cocktails and luxury living.",
    isBreakfastIncluded: true,
  },
  {
    id: "goa-calangute-beach-homestay",
    name: "Calangute Coconut Grove Homestay",
    destinationId: "goa",
    city: "Calangute, North Goa",
    type: "Homestay",
    tier: "Budget",
    address: "Holiday Street, Gauravaddo, Calangute, Goa 403516",
    coords: { lat: 15.5380, lng: 73.7620 },
    pricePerNight: 2800,
    rating: 4.4,
    roomTypes: ["Standard Garden Room", "Deluxe Balcony Room"],
    amenities: ["Complimentary tea & coffee", "Lush garden sit-out", "Bicycle rentals", "Air conditioning", "5-min walk to beach"],
    description: "Warm family-run homestay surrounded by swaying coconut palms, just steps from the golden sands of Calangute.",
    isBreakfastIncluded: false,
  },

  // ==================== HYDERABAD ====================
  {
    id: "hyd-taj-falaknuma",
    name: "Taj Falaknuma Palace",
    destinationId: "hyderabad",
    city: "Falaknuma, Hyderabad",
    type: "Heritage Palace",
    tier: "Luxury",
    address: "Engine Bowli, Falaknuma, Hyderabad, Telangana 500053",
    coords: { lat: 17.3315, lng: 78.4674 },
    pricePerNight: 38000,
    rating: 4.9,
    roomTypes: ["Palace Room", "Historical Suite", "Nizam Suite"],
    amenities: ["Royal champagne breakfast included", "Horse-drawn carriage arrival", "Palace historian tour", "Jiva Spa", "Billiards room"],
    description: "Scorpion-shaped hilltop palace once the private residence of the world's richest monarch, the Nizam of Hyderabad.",
    isBreakfastIncluded: true,
    bookingUrl: "https://www.tajhotels.com",
  },
  {
    id: "hyd-itc-kohenur",
    name: "ITC Kohenur, Luxury Collection",
    destinationId: "hyderabad",
    city: "HITEC City, Madhapur, Hyderabad",
    type: "Hotel",
    tier: "Premium",
    address: "Plot No. 5, Survey No. 83/1, Hyderabad Knowledge City, Madhapur 500081",
    coords: { lat: 17.4350, lng: 78.3845 },
    pricePerNight: 14000,
    rating: 4.8,
    roomTypes: ["Executive Club Room", "ITC One Room", "Kohinoor Grand Presidential Suite"],
    amenities: ["Breakfast included", "Durgam Cheruvu lake views", "Kaya Kalp Spa", "Dum Pukht Begum's restaurant", "Rooftop pool"],
    description: "Architectural masterpiece inspired by the legendary Koh-i-Noor diamond, overlooking Durgam Cheruvu lake in the tech corridor.",
    isBreakfastIncluded: true,
  },
  {
    id: "hyd-park-hyderabad",
    name: "The Park Hyderabad",
    destinationId: "hyderabad",
    city: "Somajiguda, Hyderabad",
    type: "Hotel",
    tier: "Moderate",
    address: "22, Raj Bhavan Road, Somajiguda, Hyderabad 500082",
    coords: { lat: 17.4220, lng: 78.4590 },
    pricePerNight: 6500,
    rating: 4.5,
    roomTypes: ["Luxury Lake View Room", "Studio Suite", "Envy Room"],
    amenities: ["Breakfast included", "Hussain Sagar lake view", "Infinity pool", "Aura Spa", "24-hr Verandah café"],
    description: "Contemporary design hotel inspired by royal jewels and metalcraft, framing panoramic views of Hussain Sagar lake.",
    isBreakfastIncluded: true,
  },
  {
    id: "hyd-banjara-boutique",
    name: "Banjara Hills Garden Boutique Retreat",
    destinationId: "hyderabad",
    city: "Banjara Hills, Hyderabad",
    type: "Boutique Stay",
    tier: "Moderate",
    address: "Road No. 12, Banjara Hills, Hyderabad 500034",
    coords: { lat: 17.4160, lng: 78.4470 },
    pricePerNight: 4200,
    rating: 4.4,
    roomTypes: ["Executive Garden Room", "Boutique Studio"],
    amenities: ["Breakfast included", "Lush courtyard garden", "Library lounge", "Free high-speed WiFi", "Air conditioning"],
    description: "Quiet green residential boutique stay surrounded by tree-lined Banjara Hills avenues, near premier cafes and galleries.",
    isBreakfastIncluded: true,
  },

  // ==================== JAIPUR ====================
  {
    id: "jpr-rambagh-palace",
    name: "Rambagh Palace",
    destinationId: "jaipur",
    city: "Bhawani Singh Road, Jaipur",
    type: "Heritage Palace",
    tier: "Luxury",
    address: "Bhawani Singh Road, Rambagh, Jaipur, Rajasthan 302005",
    coords: { lat: 26.8985, lng: 75.8080 },
    pricePerNight: 35000,
    rating: 4.9,
    roomTypes: ["Palace Room", "Historical Suite", "Royal Suite"],
    amenities: ["Royal breakfast included", "Peacocks in 47-acre Mughal gardens", "Polo Bar", "Jiva Grande Spa", "Vintage car rides"],
    description: "The 'Jewel of Jaipur', former residence of the Maharaja of Jaipur, ranked consistently among the finest luxury heritage hotels on Earth.",
    isBreakfastIncluded: true,
    bookingUrl: "https://www.tajhotels.com",
  },
  {
    id: "jpr-samode-haveli",
    name: "Samode Haveli",
    destinationId: "jaipur",
    city: "Gangapole, Old City, Jaipur",
    type: "Heritage Palace",
    tier: "Premium",
    address: "Near Jorawar Singh Gate, Gangapole, Jaipur 302002",
    coords: { lat: 26.9320, lng: 75.8360 },
    pricePerNight: 16000,
    rating: 4.8,
    roomTypes: ["Deluxe Haveli Room", "Sheesh Mahal Suite", "Haveli Suite with Balcony"],
    amenities: ["Breakfast included", "Moorish-style swimming pool", "Hand-painted frescoes", "Courtyard dining", "Quiet heritage gardens"],
    description: "Traditional Rajput haveli built 225 years ago within Jaipur's historic city walls, featuring frescoed walls and serene fountains.",
    isBreakfastIncluded: true,
  },
  {
    id: "jpr-shahpura-house",
    name: "Shahpura House",
    destinationId: "jaipur",
    city: "Bani Park, Jaipur",
    type: "Boutique Stay",
    tier: "Moderate",
    address: "D-257, Devi Marg, Bani Park, Jaipur 302016",
    coords: { lat: 26.9290, lng: 75.7910 },
    pricePerNight: 6200,
    rating: 4.6,
    roomTypes: ["Deluxe Room", "Royal Suite", "Shahpura Suite"],
    amenities: ["Breakfast included", "Rooftop restaurant with fort views", "Swimming pool", "Traditional marble carvings", "Spa"],
    description: "Elegantly restored palace residence showcasing traditional Shekhawati frescoes, marble arches, and rooftop sunset dining.",
    isBreakfastIncluded: true,
  },
  {
    id: "jpr-khatu-haveli",
    name: "Khatu Haveli Heritage Homestay",
    destinationId: "jaipur",
    city: "Old City, Jaipur",
    type: "Homestay",
    tier: "Budget",
    address: "Khatu House, Outside Chandpole Gate, Jaipur 302001",
    coords: { lat: 26.9240, lng: 75.8230 },
    pricePerNight: 2900,
    rating: 4.5,
    roomTypes: ["Standard Heritage Room", "Deluxe Courtyard Room"],
    amenities: ["Home-cooked breakfast included", "Historic family courtyard", "Terrace view of Nahargarh Fort", "Free WiFi"],
    description: "Authentic 19th-century royal family haveli homestay offering warm Rajasthani hospitality and home-cooked family recipes.",
    isBreakfastIncluded: true,
  },

  // ==================== KERALA ====================
  {
    id: "ker-kumarakom-lake-resort",
    name: "Kumarakom Lake Resort",
    destinationId: "kerala",
    city: "Kumarakom, Backwaters, Kerala",
    type: "Resort",
    tier: "Luxury",
    address: "Vembanad Lake, Kumarakom, Kottayam, Kerala 686566",
    coords: { lat: 9.6175, lng: 76.4290 },
    pricePerNight: 26000,
    rating: 4.9,
    roomTypes: ["Meandering Pool Villa", "Heritage Villa with Private Pool", "Luxury Houseboat Stay"],
    amenities: ["Kerala breakfast spread included", "250-metre winding pool", "Ayurmana Ayurvedic Spa", "Sunset backwater cruise", "Tea shop on lawns"],
    description: "Reconstructed traditional 16th-century ancestral Kerala homesteads along the pristine banks of Vembanad Lake backwaters.",
    isBreakfastIncluded: true,
    bookingUrl: "https://www.kumarakomlakeresort.in",
  },
  {
    id: "ker-brunton-boatyard",
    name: "Brunton Boatyard, CGH Earth",
    destinationId: "kerala",
    city: "Fort Kochi, Kerala",
    type: "Boutique Stay",
    tier: "Premium",
    address: "1/498, Calvathy Road, Fort Kochi, Kochi, Kerala 682001",
    coords: { lat: 9.9690, lng: 76.2420 },
    pricePerNight: 15500,
    rating: 4.8,
    roomTypes: ["Sea Facing Room", "Deluxe Harbour Suite"],
    amenities: ["Breakfast included", "Harbour-view swimming pool", "Ayurvedic wellness center", "Complimentary sunset harbour cruise"],
    description: "Restored Victorian shipyard hotel reflecting Dutch, Portuguese and British colonial sea-trade heritage along the Kochi harbour mouth.",
    isBreakfastIncluded: true,
  },
  {
    id: "ker-munnar-tea-resort",
    name: "Fragrant Nature Munnar Hill Resort",
    destinationId: "kerala",
    city: "Munnar, High Ranges, Kerala",
    type: "Resort",
    tier: "Moderate",
    address: "Pothamedu, Munnar, Idukki District, Kerala 685612",
    coords: { lat: 10.0550, lng: 77.0600 },
    pricePerNight: 7200,
    rating: 4.6,
    roomTypes: ["Tropic Green Room", "Moonlight Suite with Fireplace", "Wild Orchid Villa"],
    amenities: ["Breakfast included", "Fireplace in rooms", "Panoramic tea garden valley view", "Spa", "Guided tea plantation walks"],
    description: "Cosy alpine stone and timber sanctuary perched high above misty tea plantations and cardamom-scented valley slopes.",
    isBreakfastIncluded: true,
  },
  {
    id: "ker-alleppey-backwater-homestay",
    name: "Alleppey Backwater Palms Homestay",
    destinationId: "kerala",
    city: "Alappuzha, Kerala",
    type: "Homestay",
    tier: "Budget",
    address: "Punnamada, Finishing Point Road, Alappuzha, Kerala 688013",
    coords: { lat: 9.5020, lng: 76.3510 },
    pricePerNight: 3200,
    rating: 4.5,
    roomTypes: ["Canal View Room", "Garden Cottage"],
    amenities: ["Kerala appam & stew breakfast included", "Canoe rides through village canals", "Ayurvedic massage arrangements", "Air conditioning"],
    description: "Tranquil waterfront family homestay on the canal bank, where village canoes drift past swaying coconut fronds.",
    isBreakfastIncluded: true,
  },

  // ==================== AGRA ====================
  {
    id: "agra-oberoi-amarvilas",
    name: "The Oberoi Amarvilas",
    destinationId: "agra",
    city: "Taj East Gate, Agra",
    type: "Resort",
    tier: "Luxury",
    address: "Taj East Gate Road, Agra, Uttar Pradesh 282001",
    coords: { lat: 27.1685, lng: 78.0465 },
    pricePerNight: 36000,
    rating: 4.9,
    roomTypes: ["Premier Room Taj View", "Deluxe Suite with Balcony", "Kohinoor Suite"],
    amenities: ["Breakfast with Taj Mahal views included", "Every room overlooks the Taj Mahal", "Moorish pools", "Oberoi Spa", "Private golf cart to monument"],
    description: "Located just 600 metres from the Taj Mahal, featuring uninterrupted views of the white marble monument from every private bedroom and terrace.",
    isBreakfastIncluded: true,
  },
  {
    id: "agra-itc-mughal",
    name: "ITC Mughal, Luxury Collection",
    destinationId: "agra",
    city: "Fatehabad Road, Agra",
    type: "Hotel",
    tier: "Premium",
    address: "Fatehabad Road, Tajganj, Agra, Uttar Pradesh 282001",
    coords: { lat: 27.1590, lng: 78.0320 },
    pricePerNight: 11000,
    rating: 4.7,
    roomTypes: ["Mughal Room", "Royal Mughal Suite", "Grand Presidential Suite"],
    amenities: ["Breakfast included", "Kaya Kalp Royal Spa", "35 acres of Mughal gardens", "Swimming pools", "Peshawri restaurant"],
    description: "Sprawling award-winning hotel designed to pay homage to the great Mughal builders, set amidst 35 acres of luxuriant gardens.",
    isBreakfastIncluded: true,
  },

  // ==================== MUMBAI ====================
  {
    id: "mum-taj-mahal-palace",
    name: "The Taj Mahal Palace & Tower",
    destinationId: "mumbai",
    city: "Colaba, Mumbai",
    type: "Heritage Palace",
    tier: "Luxury",
    address: "Apollo Bunder, Colaba, Mumbai, Maharashtra 400001",
    coords: { lat: 18.9217, lng: 72.8332 },
    pricePerNight: 28000,
    rating: 4.9,
    roomTypes: ["Tower Superior Sea View", "Palace Historical Room", "Tata Suite"],
    amenities: ["Breakfast with Arabian Sea view included", "Facing Gateway of India", "Jiva Spa", "10 iconic restaurants", "Heritage walk"],
    description: "India's first luxury hotel, opened in 1903, reigning proudly over Mumbai Harbour directly opposite the Gateway of India.",
    isBreakfastIncluded: true,
  },
  {
    id: "mum-trident-nariman",
    name: "Trident Nariman Point",
    destinationId: "mumbai",
    city: "Marine Drive, Nariman Point, Mumbai",
    type: "Hotel",
    tier: "Premium",
    address: "CR 2 Nariman Point, Netaji Subhash Chandra Bose Road, Mumbai 400021",
    coords: { lat: 18.9275, lng: 72.8210 },
    pricePerNight: 14500,
    rating: 4.7,
    roomTypes: ["Superior Ocean View Room", "Trident Club Room", "Executive Suite"],
    amenities: ["Panoramic Marine Drive views", "Breakfast buffet included", "Outdoor oceanfront pool", "Trident Spa"],
    description: "Iconic Marine Drive hotel overlooking the Queen's Necklace with sweeping panoramic vistas of the Arabian Sea.",
    isBreakfastIncluded: true,
  },
  {
    id: "mum-residency-fort",
    name: "Residency Hotel Fort",
    destinationId: "mumbai",
    city: "Fort Heritage District, Mumbai",
    type: "Boutique Stay",
    tier: "Moderate",
    address: "26, Rustom Sidhwa Marg, Fort, Mumbai 400001",
    coords: { lat: 18.9372, lng: 72.8345 },
    pricePerNight: 5500,
    rating: 4.4,
    roomTypes: ["Deluxe Heritage Room", "Executive King Room"],
    amenities: ["Walking distance to CST Terminus & Kala Ghoda", "Complimentary hot breakfast", "High-speed Wi-Fi", "24/7 travel desk"],
    description: "Warm, highly-rated boutique hotel in the historic Fort district, ideal for exploring Mumbai's art galleries and colonial landmarks.",
    isBreakfastIncluded: true,
  },

  // ==================== DELHI ====================
  {
    id: "del-imperial",
    name: "The Imperial New Delhi",
    destinationId: "delhi",
    city: "Janpath, Connaught Place, New Delhi",
    type: "Heritage Palace",
    tier: "Luxury",
    address: "Janpath Lane, Connaught Place, New Delhi 110001",
    coords: { lat: 28.6225, lng: 77.2185 },
    pricePerNight: 22000,
    rating: 4.8,
    roomTypes: ["Heritage Room", "Deco Suite", "Royal Imperial Suite"],
    amenities: ["Royal breakfast included", "Colonial museum art gallery with 5000+ prints", "Imperial Spa", "Italian and Pan-Asian dining"],
    description: "Legendary Art Deco and Victorian grand hotel opened in 1931, celebrated as a living museum of Indian history and art.",
    isBreakfastIncluded: true,
  },
  {
    id: "del-the-claridges",
    name: "The Claridges New Delhi",
    destinationId: "delhi",
    city: "Lutyens' Delhi, New Delhi",
    type: "Heritage Palace",
    tier: "Premium",
    address: "12, Dr APJ Abdul Kalam Road, New Delhi 110011",
    coords: { lat: 28.5992, lng: 77.2160 },
    pricePerNight: 13500,
    rating: 4.6,
    roomTypes: ["Claridges Room", "Deluxe Room", "The Heritage Suite"],
    amenities: ["Buffet breakfast at Sevilla lawn included", "Lush green courtyard", "Dhaba iconic North Indian dining", "Swimming pool"],
    description: "Timeless 1950s landmark in leafy Lutyens' Delhi featuring historic classic architecture, serene cabanas, and legendary culinary dining.",
    isBreakfastIncluded: true,
  },
  {
    id: "del-blooming-cp",
    name: "Bloomrooms @ Janpath",
    destinationId: "delhi",
    city: "Janpath, Connaught Place, New Delhi",
    type: "Hotel",
    tier: "Moderate",
    address: "1 Janpath Lane, Connaught Place, New Delhi 110001",
    coords: { lat: 28.6210, lng: 77.2175 },
    pricePerNight: 4600,
    rating: 4.4,
    roomTypes: ["Standard Queen Room", "Superior Twin Room"],
    amenities: ["Steps from CP & Janpath Market", "Signature crisp CloudBeds", "Hot café breakfast included", "High pressure rain showers"],
    description: "Fresh, vibrant modern hotel in central Connaught Place known for impeccable cleanliness, radiant yellow hues, and unbeatable location.",
    isBreakfastIncluded: true,
  },
  {
    id: "agra-hotel-sheela",
    name: "Hotel Sheela Taj View",
    destinationId: "agra",
    city: "Tajganj, Eastern Gate, Agra",
    type: "Guesthouse",
    tier: "Budget",
    address: "Eastern Gate Taj Mahal, Tajganj, Agra 282001",
    coords: { lat: 27.1730, lng: 78.0450 },
    pricePerNight: 1800,
    rating: 4.1,
    roomTypes: ["Standard Garden Room", "Taj Facing Room"],
    amenities: ["100m walk from Taj Mahal Eastern Gate", "Peaceful garden courtyard", "Fresh morning tea & parathas", "Free Wi-Fi"],
    description: "Charming, budget-friendly retreat set in a car-free quiet zone right by the Eastern Gate of the Taj Mahal.",
    isBreakfastIncluded: false,
  },
];

export function getAccommodationsForDestination(destId: string): AccommodationItem[] {
  const norm = destId.toLowerCase().trim().replace(/[\s_]+/g, "-");
  return accommodations.filter(
    a => a.destinationId === norm || a.destinationId === destId.toLowerCase().trim()
  );
}

export function getRecommendedAccommodation(
  destId: string,
  budgetTier?: string
): AccommodationItem | undefined {
  const list = getAccommodationsForDestination(destId);
  if (list.length === 0) return undefined;

  if (budgetTier) {
    const match = list.find(a => a.tier.toLowerCase() === budgetTier.toLowerCase());
    if (match) return match;
  }

  // Fallback to Moderate or first item
  return list.find(a => a.tier === "Moderate") || list[0];
}
