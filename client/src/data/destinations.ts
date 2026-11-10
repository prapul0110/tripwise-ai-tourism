import { indiaCatalogue } from "./indiaCatalogue";
export { foodPlaces, getFoodPlacesForDestination, type FoodPlace } from "./foodPlaces";

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
  gallery?: string[];
  coords: { lat: number; lng: number };
  tags: string[];
  points: PointOfInterest[];
};

export function getCategoryFallbackImage(category?: string): string {
  switch (category) {
    case "Coast":
      return "/images/destinations/goa.jpg";
    case "Culture":
      return "/images/destinations/jaipur.jpg";
    case "Nature":
      return "/images/destinations/kerala.jpg";
    case "Mountains":
      return "/images/destinations/manali.jpg";
    case "City":
      return "/images/destinations/mumbai.jpg";
    default:
      return "/images/india.jpg";
  }
}

const images = {
  goa: "/images/destinations/goa.jpg",
  hyderabad: "/images/destinations/hyderabad.jpg",
  kerala: "/images/destinations/kerala.jpg",
  jaipur: "/images/destinations/jaipur.jpg",
  manali: "/images/destinations/manali.jpg",
  mumbai: "/images/destinations/mumbai.jpg",
  delhi: "/images/destinations/delhi.jpg",
  bengaluru: "/images/destinations/bengaluru.jpg",
  chennai: "/images/destinations/chennai.jpg",
  agra: "/images/destinations/agra.jpg",
  india: "/images/india.jpg",
};

export const destinations: Destination[] = [
  {
    id: "goa",
    name: "Goa",
    state: "Goa",
    region: "West",
    category: "Coast",
    image: images.goa,
    description: "Slow beach mornings, Portuguese-era lanes and sunset-facing tables along India’s western coast.",
    coords: { lat: 15.4909, lng: 73.8278 },
    tags: ["beaches", "food", "nightlife", "adventure", "culture", "relaxation"],
    points: [
      { id: "baga", name: "Baga Beach", category: "Attraction", description: "Vibrant shoreline known for coastal breezes, water sports and evening beach shacks.", planningCost: 700, duration: "2–3 hours", coords: { lat: 15.5553, lng: 73.7517 } },
      { id: "aguada", name: "Fort Aguada", category: "Attraction", description: "17th-century Portuguese fortress and lighthouse commanding sweeping Arabian Sea views.", planningCost: 100, duration: "2 hours", coords: { lat: 15.4922, lng: 73.7736 } },
      { id: "anjuna", name: "Anjuna Cliffs & Flea Market", category: "Activity", description: "Red laterite cliffs overlooking the sea with open-air cafés and sunset music venues.", planningCost: 400, duration: "2 hours", coords: { lat: 15.5731, lng: 73.7402 } },
      { id: "panjim", name: "Fontainhas Latin Quarter", category: "Hidden gem", description: "Colourful heritage walk among Portuguese villas, quaint balconies and traditional bakeries.", planningCost: 200, duration: "2 hours", coords: { lat: 15.4982, lng: 73.8270 } },
      { id: "bom-jesus", name: "Basilica of Bom Jesus", category: "Attraction", description: "UNESCO World Heritage baroque church enshrining the sacred relics of St. Francis Xavier.", planningCost: 50, duration: "90 minutes", coords: { lat: 15.5009, lng: 73.9116 } },
      { id: "chapora", name: "Chapora Fort", category: "Attraction", description: "High ramparts overlooking Vagator beach and the Chapora river mouth, famous for panoramic sunsets.", planningCost: 50, duration: "90 minutes", coords: { lat: 15.6059, lng: 73.7360 } },
      { id: "palolem", name: "Palolem Beach & Canoe Haven", category: "Attraction", description: "Gentle crescent bay with calm waters, swaying coconut palms and dolphin-spotting boats.", planningCost: 600, duration: "3 hours", coords: { lat: 15.0100, lng: 74.0232 } },
      { id: "sahakari", name: "Sahakari Spice Plantation", category: "Activity", description: "Aromatic guided walk through cardamom, vanilla and betel nut groves paired with traditional Goan lunch.", planningCost: 500, duration: "2–3 hours", coords: { lat: 15.4052, lng: 74.0264 } },
      { id: "dudhsagar", name: "Dudhsagar Waterfalls Trek", category: "Activity", description: "Four-tiered majestic cascade deep in the Western Ghats jungle on the Mandovi River.", planningCost: 1200, duration: "Full day", coords: { lat: 15.3144, lng: 74.3143 } },
      { id: "reis-magos", name: "Reis Magos Fort", category: "Attraction", description: "Restored riverfront bastion across from Panaji showcasing historic cannons and cultural exhibits.", planningCost: 100, duration: "90 minutes", coords: { lat: 15.4975, lng: 73.8090 } },
      { id: "mangueshi", name: "Mangueshi Temple", category: "Attraction", description: "Historic 450-year-old Goan Hindu temple featuring distinctive deepstambha lamp tower.", planningCost: 50, duration: "1 hour", coords: { lat: 15.3970, lng: 73.9687 } },
      { id: "divar", name: "Divar Island Heritage Trail", category: "Hidden gem", description: "Peaceful river island accessible by ferry, dotted with paddy fields, vintage chapels and village lanes.", planningCost: 300, duration: "3 hours", coords: { lat: 15.5173, lng: 73.9022 } },
      { id: "cabo-de-rama", name: "Cabo de Rama Fort & Cliff", category: "Attraction", description: "Ancient coastal bastion towering above secluded cliffs and turquoise Arabian sea waters.", planningCost: 50, duration: "2 hours", coords: { lat: 15.0890, lng: 73.9210 } },
      { id: "arambol", name: "Arambol Sweet Water Lake", category: "Hidden gem", description: "Freshwater lagoon nestled under hillside banyan trees steps away from bohemian Arambol beach.", planningCost: 100, duration: "3 hours", coords: { lat: 15.6880, lng: 73.7040 } },
      { id: "se-cathedral", name: "Se Cathedral Old Goa", category: "Attraction", description: "One of the largest churches in Asia, built in Portuguese-Manueline style with the giant Golden Bell.", planningCost: 0, duration: "1 hour", coords: { lat: 15.5036, lng: 73.9125 } },
      { id: "morjim", name: "Morjim Beach Turtle Nesting Site", category: "Attraction", description: "Tranquil expansive shoreline protected as a nesting habitat for endangered Olive Ridley sea turtles.", planningCost: 200, duration: "2 hours", coords: { lat: 15.6265, lng: 73.7380 } },
      { id: "immaculate-church", name: "Our Lady of the Immaculate Conception", category: "Attraction", description: "Iconic zigzagging baroque staircase and gleaming white facade reigning over central Panaji square.", planningCost: 0, duration: "45 minutes", coords: { lat: 15.4989, lng: 73.8288 } },
      { id: "tambdi-surla", name: "Tambdi Surla Mahadev Temple", category: "Hidden gem", description: "12th-century Kadamba black basalt temple hidden inside the lush Bhagwan Mahaveer Sanctuary.", planningCost: 100, duration: "Half day", coords: { lat: 15.4410, lng: 74.2540 } },
      { id: "salim-ali-bird", name: "Dr. Salim Ali Bird Sanctuary", category: "Activity", description: "Mangrove island sanctuary reached by ferry on Mandovi river, hosting kingfishers, mudskippers, and egrets.", planningCost: 250, duration: "2–3 hours", coords: { lat: 15.5115, lng: 73.8640 } },
      { id: "butterfly-beach", name: "Butterfly Beach Hidden Cove", category: "Hidden gem", description: "Semi-circular secluded bay reached by boat from Palolem, famous for dolphins and golden sand.", planningCost: 800, duration: "3 hours", coords: { lat: 15.0210, lng: 74.0040 } },
    ],
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    region: "South",
    category: "Culture",
    image: images.hyderabad,
    description: "A layered city of palaces, bazaars and Deccani flavours where historic monuments meet a contemporary skyline.",
    coords: { lat: 17.385, lng: 78.4867 },
    tags: ["history", "culture", "food", "city", "architecture"],
    points: [
      { id: "charminar", name: "Charminar & Laad Bazaar", category: "Attraction", description: "16th-century four-minaret monument surrounded by lively pearl and lacquer bangle markets.", planningCost: 100, duration: "2 hours", coords: { lat: 17.3616, lng: 78.4747 } },
      { id: "golconda", name: "Golconda Fort", category: "Attraction", description: "Acoustic medieval citadel with royal palaces, armouries and panoramic hilltop battlements.", planningCost: 300, duration: "3 hours", coords: { lat: 17.3833, lng: 78.4011 } },
      { id: "chowmahalla", name: "Chowmahalla Palace", category: "Hidden gem", description: "Opulent seat of the Asaf Jahi dynasty showcasing courtyards, vintage cars and grand chandeliered halls.", planningCost: 150, duration: "2 hours", coords: { lat: 17.3578, lng: 78.4718 } },
      { id: "hussain", name: "Hussain Sagar & Buddha Statue", category: "Activity", description: "Lakeside promenade featuring the monolithic Buddha statue and pleasant evening breeze.", planningCost: 200, duration: "90 minutes", coords: { lat: 17.4239, lng: 78.4738 } },
      { id: "salar-jung", name: "Salar Jung Museum", category: "Attraction", description: "One of India's premier national museums housing prized global antiquities, sculptures and musical clocks.", planningCost: 100, duration: "3 hours", coords: { lat: 17.3713, lng: 78.4804 } },
      { id: "qutb-shahi", name: "Qutb Shahi Tombs", category: "Attraction", description: "Domed royal tombs set in landscaped gardens reflecting Persian and Hindu architectural fusion.", planningCost: 100, duration: "2 hours", coords: { lat: 17.3941, lng: 78.3963 } },
      { id: "birla-mandir", name: "Birla Mandir Hilltop", category: "Attraction", description: "White Rajasthani marble temple perched atop Naubath Pahad overlooking the twin cities.", planningCost: 0, duration: "1 hour", coords: { lat: 17.4062, lng: 78.4691 } },
      { id: "shilparamam", name: "Shilparamam Arts & Crafts Village", category: "Activity", description: "Sprawling traditional crafts and cultural village showcasing rural Indian artisans and handlooms.", planningCost: 150, duration: "3 hours", coords: { lat: 17.4528, lng: 78.3789 } },
      { id: "falaknuma", name: "Taj Falaknuma Palace Heritage Walk", category: "Hidden gem", description: "Scorpion-shaped hilltop palace of the Nizams with Venetian chandeliers and Italian marble staircases.", planningCost: 1000, duration: "2 hours", coords: { lat: 17.3315, lng: 78.4674 } },
      { id: "nehru-zoo", name: "Nehru Zoological Park", category: "Activity", description: "380-acre wildlife park with safari trails, nocturnal animal house and natural lake sanctuary.", planningCost: 100, duration: "Half day", coords: { lat: 17.3508, lng: 78.4516 } },
      { id: "kbr-park", name: "KBR National Park Nature Walk", category: "Hidden gem", description: "Protected jungle park in Jubilee Hills with shaded jogging trails and peacock habitats.", planningCost: 50, duration: "90 minutes", coords: { lat: 17.4237, lng: 78.4168 } },
      { id: "mecca-masjid", name: "Makkah Masjid (Mecca Masjid)", category: "Attraction", description: "One of India's grandest historic mosques constructed with bricks made from soil brought from Mecca.", planningCost: 0, duration: "1 hour", coords: { lat: 17.3605, lng: 78.4735 } },
      { id: "paigah-tombs", name: "Paigah Tombs Architectural Marvel", category: "Hidden gem", description: "Intricate mosaic stucco work, marble lattice screens and aristocratic mausoleums of the Paigah nobles.", planningCost: 50, duration: "90 minutes", coords: { lat: 17.3450, lng: 78.4980 } },
      { id: "taramati", name: "Taramati Baradari Cultural Complex", category: "Attraction", description: "Historic acoustic pavilion built by Sultan Ibrahim Qutb Shah for royal musical performances.", planningCost: 100, duration: "2 hours", coords: { lat: 17.3790, lng: 78.3750 } },
      { id: "birla-planetarium", name: "Birla Science Museum & Planetarium", category: "Activity", description: "State-of-the-art dome planetarium, dinosaur fossil gallery and interactive science exhibitions.", planningCost: 150, duration: "2 hours", coords: { lat: 17.4048, lng: 78.4716 } },
      { id: "durgam-cheruvu", name: "Durgam Cheruvu Secret Lake & Cable Bridge", category: "Activity", description: "Granite-rimmed lake with illuminated cable-stayed bridge, walking decks and pedal boats.", planningCost: 100, duration: "2 hours", coords: { lat: 17.4360, lng: 78.3840 } },
      { id: "state-museum", name: "Telangana State Archaeology Museum", category: "Attraction", description: "Historic Indo-Islamic museum inside Public Gardens housing Egyptian mummies and Kakatiya bronzes.", planningCost: 50, duration: "90 minutes", coords: { lat: 17.3980, lng: 78.4720 } },
      { id: "gandipet", name: "Osman Sagar (Gandipet) Lake & Park", category: "Activity", description: "Historic freshwater reservoir engineered by Sir M. Visvesvaraya with landscaped sunset lawns.", planningCost: 100, duration: "2 hours", coords: { lat: 17.3770, lng: 78.2970 } },
      { id: "jagannath-hyd", name: "Jagannath Temple Banjara Hills", category: "Hidden gem", description: "Replica of the famed Puri shrine built with red sandstone and intricate Kalinga carvings.", planningCost: 0, duration: "1 hour", coords: { lat: 17.4200, lng: 78.4410 } },
    ],
  },
  {
    id: "kerala",
    name: "Kerala",
    state: "Kerala",
    region: "South",
    category: "Nature",
    image: images.kerala,
    description: "Backwater rhythms, tea-covered slopes and coastal kitchens connected by scenic, unhurried routes.",
    coords: { lat: 9.9312, lng: 76.2673 },
    tags: ["nature", "relaxation", "food", "family", "wellness"],
    points: [
      { id: "fortkochi", name: "Fort Kochi Shoreline & Chinese Nets", category: "Attraction", description: "Waterfront promenade flanked by cantilevered Chinese fishing nets, colonial villas and art cafés.", planningCost: 150, duration: "2 hours", coords: { lat: 9.9658, lng: 76.2425 } },
      { id: "munnar", name: "Munnar Tea Gardens & Eravikulam", category: "Activity", description: "Endless rolling emerald tea plantations, mist-covered mountain valleys and Nilgiri Tahr habitat.", planningCost: 800, duration: "Full day", coords: { lat: 10.0889, lng: 77.0595 } },
      { id: "alappuzha", name: "Alappuzha Backwaters Houseboat Cruise", category: "Activity", description: "Serene glide along palm-fringed canals, paddy fields and peaceful village waterways.", planningCost: 1500, duration: "Half day", coords: { lat: 9.4981, lng: 76.3388 } },
      { id: "mattancherry", name: "Mattancherry Palace & Jew Town", category: "Hidden gem", description: "Dutch Palace murals depicting Hindu epics and historic spice-trading antique alleys.", planningCost: 100, duration: "2 hours", coords: { lat: 9.9581, lng: 76.2594 } },
      { id: "athirappilly", name: "Athirappilly Waterfalls", category: "Attraction", description: "Majestic 80-foot cascade crashing through Western Ghats rainforest on the Chalakudy River.", planningCost: 200, duration: "3 hours", coords: { lat: 10.2851, lng: 76.5698 } },
      { id: "kovalam", name: "Kovalam Lighthouse Beach", category: "Attraction", description: "Curved sandy beach with striped red-and-white lighthouse and coastal seafood dining.", planningCost: 250, duration: "2–3 hours", coords: { lat: 8.3992, lng: 76.9787 } },
      { id: "periyar", name: "Periyar Wildlife Sanctuary Thekkady", category: "Activity", description: "Spice-scented reserve around Lake Periyar offering boat safaris to spot wild elephants.", planningCost: 500, duration: "Half day", coords: { lat: 9.4679, lng: 77.1435 } },
      { id: "varkala", name: "Varkala Cliff & Papanasam Beach", category: "Attraction", description: "Unique red laterite cliff rising dramatically over the Arabian Sea with seaside cafés.", planningCost: 200, duration: "3 hours", coords: { lat: 8.7379, lng: 76.7032 } },
      { id: "kumarakom", name: "Kumarakom Bird Sanctuary", category: "Activity", description: "Lush wetland bird sanctuary on Vembanad Lake hosting migratory waterfowl and egrets.", planningCost: 250, duration: "2 hours", coords: { lat: 9.6175, lng: 76.4300 } },
      { id: "marari", name: "Marari Palm Shoreline", category: "Hidden gem", description: "Quiet fishing village shoreline with soft golden sands, coconut groves and Ayurvedic retreats.", planningCost: 100, duration: "2 hours", coords: { lat: 9.6011, lng: 76.2974 } },
      { id: "bekal", name: "Bekal Fort Coastal Citadel", category: "Attraction", description: "Keyhole-shaped coastal fort ramparts jutting into the sea with observation towers.", planningCost: 100, duration: "2 hours", coords: { lat: 12.3927, lng: 75.0315 } },
      { id: "jatayu-center", name: "Jatayu Earth's Center Nature Park", category: "Attraction", description: "World's largest bird sculpture perched on a hilltop rock offering cable car rides and adventure caves.", planningCost: 600, duration: "3 hours", coords: { lat: 8.8675, lng: 76.8675 } },
      { id: "edakkal-caves", name: "Edakkal Prehistoric Rock Art Caves", category: "Hidden gem", description: "Neolithic petroglyph carvings dating back to 6,000 BCE located inside high Ambukuthi hills in Wayanad.", planningCost: 150, duration: "3 hours", coords: { lat: 11.6280, lng: 76.2345 } },
      { id: "poovar-island", name: "Poovar Island Mangrove Estuary", category: "Activity", description: "Tranquil boat cruise where Neyyar river, backwaters, and golden sand spit meet the Arabian sea.", planningCost: 900, duration: "2 hours", coords: { lat: 8.3180, lng: 77.0680 } },
      { id: "st-francis-church", name: "St. Francis Church Fort Kochi", category: "Attraction", description: "Oldest European church built in India (1503), originally housing the burial vault of explorer Vasco da Gama.", planningCost: 0, duration: "45 minutes", coords: { lat: 9.9660, lng: 76.2415 } },
      { id: "silent-valley", name: "Silent Valley National Park Evergreen Reserve", category: "Activity", description: "Pristine virgin rainforest sanctuary harboring endangered Lion-tailed macaques and rare orchids.", planningCost: 700, duration: "Full day", coords: { lat: 11.0850, lng: 76.4520 } },
      { id: "cheeyappara-falls", name: "Cheeyappara & Valara Waterfalls", category: "Attraction", description: "Seven-tiered mountain cascade tumbling over roadside rocks on the scenic Kochi-Munnar highway.", planningCost: 50, duration: "1 hour", coords: { lat: 10.0210, lng: 76.8920 } },
    ],
  },
  {
    id: "jaipur",
    name: "Jaipur",
    state: "Rajasthan",
    region: "North",
    category: "Culture",
    image: images.jaipur,
    description: "A craft-rich royal city shaped by pink facades, observatories and hilltop forts.",
    coords: { lat: 26.9124, lng: 75.7873 },
    tags: ["history", "culture", "shopping", "photography", "architecture"],
    points: [
      { id: "amber", name: "Amber Fort & Maota Lake", category: "Attraction", description: "Majestic hilltop fortress with Sheesh Mahal mirror palace and elephant pathways above the lake.", planningCost: 550, duration: "3 hours", coords: { lat: 26.9855, lng: 75.8513 } },
      { id: "hawa", name: "Hawa Mahal Palace of Winds", category: "Attraction", description: "Iconic honeycomb pink sandstone facade with 953 jharokhas overlooking bustling city bazaars.", planningCost: 200, duration: "1 hour", coords: { lat: 26.9239, lng: 75.8267 } },
      { id: "city-palace", name: "City Palace Jaipur", category: "Attraction", description: "Royal palace museum and courtyards blending Rajasthani and Mughal architectural mastery.", planningCost: 400, duration: "2 hours", coords: { lat: 26.9258, lng: 75.8237 } },
      { id: "jantar-mantar", name: "Jantar Mantar Observatory", category: "Attraction", description: "UNESCO 18th-century stone astronomical instruments including the world's largest stone sundial.", planningCost: 200, duration: "90 minutes", coords: { lat: 26.9248, lng: 75.8246 } },
      { id: "nahargarh", name: "Nahargarh Fort Sunset Viewpoint", category: "Activity", description: "Ridge-top fort walls offering dramatic sunset views across the entire glowing pink city below.", planningCost: 150, duration: "2 hours", coords: { lat: 26.9372, lng: 75.8155 } },
      { id: "jaigarh", name: "Jaigarh Fort & Jaivana Cannon", category: "Attraction", description: "Rugged military fortress holding the world's largest wheeled cannon overlooking Amber.", planningCost: 150, duration: "2 hours", coords: { lat: 26.9850, lng: 75.8456 } },
      { id: "albert-hall", name: "Albert Hall State Museum", category: "Attraction", description: "Indo-Saracenic museum building in Ram Niwas Garden illuminated spectacularly at night.", planningCost: 150, duration: "2 hours", coords: { lat: 26.9116, lng: 75.8195 } },
      { id: "jal-mahal", name: "Jal Mahal Water Palace", category: "Attraction", description: "Serene palace appearing to float in the center of Man Sagar Lake against the Aravalli hills.", planningCost: 100, duration: "1 hour", coords: { lat: 26.9535, lng: 75.8462 } },
      { id: "patrika-gate", name: "Patrika Gate & Jawahar Circle", category: "Hidden gem", description: "Vibrantly painted archways depicting Rajasthan's cultural history and royal lineages.", planningCost: 50, duration: "1 hour", coords: { lat: 26.8289, lng: 75.8058 } },
      { id: "galtaji", name: "Galtaji Sun Temple Kunds", category: "Hidden gem", description: "Ancient temple complex built into a mountain pass with natural springs and monkey habitats.", planningCost: 100, duration: "2 hours", coords: { lat: 26.9163, lng: 75.8587 } },
      { id: "chokhi-dhani", name: "Chokhi Dhani Ethnic Village", category: "Activity", description: "Evening cultural immersion with folk dances, camel rides, puppetry and traditional dining.", planningCost: 900, duration: "3 hours", coords: { lat: 26.7663, lng: 75.8361 } },
      { id: "panna-meena", name: "Panna Meena Ka Kund Stepwell", category: "Hidden gem", description: "16th-century geometric symmetrical stepwell tucked beside Amber with stunning crisscross stone steps.", planningCost: 0, duration: "45 minutes", coords: { lat: 26.9880, lng: 75.8545 } },
      { id: "sisodia-rani", name: "Sisodia Rani Garden & Palace", category: "Attraction", description: "Terraced Mughal-style garden with tiered fountains, water channels, and painted pavilions celebrating Radha-Krishna.", planningCost: 100, duration: "90 minutes", coords: { lat: 26.8835, lng: 75.8640 } },
      { id: "jagat-shiromani", name: "Jagat Shiromani Temple Amer", category: "Hidden gem", description: "Exquisite stone-carved Hindu temple dedicated to Lord Krishna and Meera Bai with grand torana gates.", planningCost: 50, duration: "1 hour", coords: { lat: 26.9890, lng: 75.8510 } },
      { id: "smriti-van", name: "Smriti Van Biodiversity Reserve", category: "Activity", description: "Lush botanical haven in the city heart with quiet walking trails, bird habitats, and seasonal blooms.", planningCost: 50, duration: "2 hours", coords: { lat: 26.8770, lng: 75.8115 } },
      { id: "anokhi-museum", name: "Anokhi Museum of Hand Printing", category: "Hidden gem", description: "Restored haveli near Amber demonstrating generational Rajasthani block-printing heritage and textile arts.", planningCost: 100, duration: "90 minutes", coords: { lat: 26.9925, lng: 75.8495 } },
    ],
  },
  {
    id: "manali",
    name: "Manali",
    state: "Himachal Pradesh",
    region: "North",
    category: "Mountains",
    image: images.manali,
    description: "A mountain base for pine-scented trails, riverside rests and high-altitude adventure planning.",
    coords: { lat: 32.2396, lng: 77.1887 },
    tags: ["adventure", "nature", "photography", "relaxation", "mountains"],
    points: [
      { id: "hadimba", name: "Hadimba Devi Cedar Temple", category: "Attraction", description: "Four-tiered wooden pagoda temple carved amidst soaring cedar and pine woodlands.", planningCost: 100, duration: "1 hour", coords: { lat: 32.2432, lng: 77.1892 } },
      { id: "solang", name: "Solang Valley Mountain Adventures", category: "Activity", description: "Scenic alpine valley for paragliding, zorbing, cable car rides and snowy mountain views.", planningCost: 1200, duration: "Half day", coords: { lat: 32.3132, lng: 77.1552 } },
      { id: "old-manali", name: "Old Manali Riverside Village & Cafés", category: "Hidden gem", description: "Traditional stone-and-timber village with riverside bakeries, apple orchards and live music.", planningCost: 250, duration: "2 hours", coords: { lat: 32.2530, lng: 77.1820 } },
      { id: "jogini", name: "Jogini Waterfall Pine Trail", category: "Activity", description: "Pleasant trail winding through pine groves and apple orchards to scenic cliff cascades.", planningCost: 150, duration: "3 hours", coords: { lat: 32.2685, lng: 77.1955 } },
      { id: "vashisht", name: "Vashisht Hot Water Springs", category: "Attraction", description: "Natural therapeutic sulfur springs adjacent to centuries-old stone temple sanctuaries.", planningCost: 50, duration: "1 hour", coords: { lat: 32.2612, lng: 77.1902 } },
      { id: "rohtang", name: "Rohtang Pass Snow Crest", category: "Activity", description: "Legendary high-altitude mountain pass at 13,058 feet offering glaciers and Pir Panjal range panoramas.", planningCost: 1500, duration: "Full day", coords: { lat: 32.3716, lng: 77.2466 } },
      { id: "naggar-castle", name: "Naggar Castle Heritage Estate", category: "Attraction", description: "15th-century wood-and-stone Himalayan palace overlooking the Beas River valley and Roerich Art Gallery.", planningCost: 100, duration: "3 hours", coords: { lat: 32.1158, lng: 77.1706 } },
      { id: "van-vihar", name: "Van Vihar Deodar Forest Park", category: "Attraction", description: "Peaceful riverside park shaded by towering deodar trees with a small boating pond beside Beas River.", planningCost: 50, duration: "1 hour", coords: { lat: 32.2415, lng: 77.1875 } },
      { id: "beas-kund", name: "Beas Kund Glacier Trek Gateway", category: "Activity", description: "Source of the Beas River nestled beneath Hanuman Tibba and Friendship Peak in high alpine meadows.", planningCost: 900, duration: "Full day", coords: { lat: 32.3650, lng: 77.0850 } },
      { id: "manu-temple", name: "Manu Temple Old Manali", category: "Attraction", description: "Sacred pagoda-style shrine dedicated to Sage Manu, the mythological creator of humankind in Hindu lore.", planningCost: 0, duration: "1 hour", coords: { lat: 32.2570, lng: 77.1790 } },
      { id: "gulaba", name: "Gulaba Meadow Viewpoint", category: "Hidden gem", description: "Tranquil wildflower meadows on the Rohtang highway ideal for snow activities and alpine photography.", planningCost: 300, duration: "Half day", coords: { lat: 32.3200, lng: 77.2180 } },
      { id: "himalayan-nyingmapa", name: "Himalayan Nyingmapa Buddhist Gompa", category: "Attraction", description: "Peaceful yellow-roofed Buddhist monastery near Mall Road housing a large gilded Sakyamuni Buddha statue.", planningCost: 0, duration: "45 minutes", coords: { lat: 28.2430, lng: 77.1880 } },
    ],
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    region: "West",
    category: "City",
    image: images.mumbai,
    description: "Coastal energy, Victorian Gothic landmarks and sea-facing promenades where India’s modern story unfolds.",
    coords: { lat: 18.922, lng: 72.8347 },
    tags: ["city", "history", "food", "architecture", "nightlife"],
    points: [
      { id: "gateway", name: "Gateway of India Harbourfront", category: "Attraction", description: "Colonial basalt arch on Mumbai harbour facing the Arabian Sea and historic Taj Palace.", planningCost: 100, duration: "90 minutes", coords: { lat: 18.9220, lng: 72.8347 } },
      { id: "marine-drive", name: "Marine Drive Queen’s Necklace", category: "Activity", description: "Sweeping 3-kilometre waterfront promenade celebrated for evening breezes and street food.", planningCost: 200, duration: "2 hours", coords: { lat: 18.9432, lng: 72.8231 } },
      { id: "elephanta", name: "Elephanta Caves Island Excursion", category: "Attraction", description: "UNESCO 6th-century rock-cut cave temples dedicated to Shiva, reached by a scenic ferry ride.", planningCost: 400, duration: "Half day", coords: { lat: 18.9633, lng: 72.9315 } },
      { id: "cst-station", name: "Chhatrapati Shivaji Maharaj Terminus", category: "Attraction", description: "UNESCO Victorian Gothic railway headquarters featuring gargoyles, domes and stained glass.", planningCost: 50, duration: "1 hour", coords: { lat: 18.9400, lng: 72.8354 } },
      { id: "kala-ghoda", name: "Kala Ghoda Art & Heritage Precinct", category: "Hidden gem", description: "Walkable art precinct lined with Indo-Gothic buildings, designer boutiques and legacy bakeries.", planningCost: 300, duration: "2 hours", coords: { lat: 18.9275, lng: 72.8328 } },
      { id: "bandra-bandstand", name: "Bandra Bandstand & Sea Link Vista", category: "Activity", description: "Coastal rocky promenade with sunset views of the Bandra-Worli Sea Link and seaside cafés.", planningCost: 200, duration: "2 hours", coords: { lat: 19.0435, lng: 72.8195 } },
      { id: "crawford-market", name: "Crawford Market & Mangaldas Fabric Bazaar", category: "Activity", description: "Victorian covered market featuring Lockyer Kipling stone bas-reliefs and bustling wholesale trade.", planningCost: 250, duration: "2 hours", coords: { lat: 18.9475, lng: 72.8342 } },
      { id: "sanjay-gandhi-park", name: "Sanjay Gandhi National Park & Kanheri Caves", category: "Activity", description: "Sprawling inner-city wilderness with ancient 1st-century Buddhist rock caves and tiger safari.", planningCost: 350, duration: "Half day", coords: { lat: 19.2183, lng: 72.9125 } },
      { id: "haji-ali", name: "Haji Ali Dargah Coastal Causeway", category: "Attraction", description: "15th-century white marble islet shrine connected to Worli shore by a narrow walkway covered during high tide.", planningCost: 0, duration: "90 minutes", coords: { lat: 18.9827, lng: 72.8089 } },
      { id: "dhobi-ghat", name: "Mahalaxmi Dhobi Ghat", category: "Attraction", description: "World's largest open-air human laundry where hundreds of washermen clean garments in concrete wash pens.", planningCost: 100, duration: "1 hour", coords: { lat: 18.9825, lng: 72.8255 } },
      { id: "banganga-tank", name: "Banganga Sacred Water Tank", category: "Hidden gem", description: "Ancient rectangular freshwater tank surrounded by 12th-century stone steps, temples and ringing bells in Malabar Hill.", planningCost: 0, duration: "1 hour", coords: { lat: 18.9450, lng: 72.7930 } },
      { id: "mumbai-museum", name: "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya", category: "Attraction", description: "Premier art and history museum housed in a majestic Indo-Saracenic mansion surrounded by palm gardens.", planningCost: 150, duration: "2–3 hours", coords: { lat: 18.9268, lng: 72.8326 } },
    ],
  },
  {
    id: "delhi",
    name: "Delhi",
    state: "Delhi",
    region: "North",
    category: "City",
    image: images.delhi,
    description: "Seven historic cities layered into one grand capital of monuments, gardens and vibrant culinary avenues.",
    coords: { lat: 28.6139, lng: 77.209 },
    tags: ["history", "culture", "food", "architecture", "city"],
    points: [
      { id: "humayun-tomb", name: "Humayun’s Tomb Gardens", category: "Attraction", description: "UNESCO Persian garden-tomb of red sandstone and marble that inspired the Taj Mahal.", planningCost: 250, duration: "2 hours", coords: { lat: 28.5933, lng: 77.2507 } },
      { id: "red-fort", name: "Red Fort (Lal Qila)", category: "Attraction", description: "Mughal imperial seat of red sandstone commanding Old Delhi with Diwan-i-Aam and Lahori Gate.", planningCost: 350, duration: "3 hours", coords: { lat: 28.6562, lng: 77.2410 } },
      { id: "qutub-minar", name: "Qutub Minar & Mehrauli Archaeological Park", category: "Attraction", description: "Soaring 73-metre minaret and historic ruins surrounded by lush ancient woodlands.", planningCost: 250, duration: "2 hours", coords: { lat: 28.5245, lng: 77.1855 } },
      { id: "lodhi-gardens", name: "Lodhi Gardens & Art District", category: "Activity", description: "Tranquil 15th-century Sayyid and Lodi tombs nestled in manicured lawns and vibrant mural lanes.", planningCost: 100, duration: "2 hours", coords: { lat: 28.5931, lng: 77.2197 } },
      { id: "india-gate", name: "India Gate & National War Memorial", category: "Attraction", description: "Open ceremonial triumphal arch and illuminated lawns honoring national heroes.", planningCost: 50, duration: "90 minutes", coords: { lat: 28.6129, lng: 77.2295 } },
      { id: "jama-masjid", name: "Jama Masjid Old Delhi", category: "Attraction", description: "Shah Jahan’s colossal 17th-century congregational mosque with red sandstone courtyard and towering minarets.", planningCost: 100, duration: "90 minutes", coords: { lat: 28.6507, lng: 77.2334 } },
      { id: "chandni-chowk", name: "Chandni Chowk Heritage & Rickshaw Trail", category: "Activity", description: "Atmospheric bazaar exploration by cycle-rickshaw navigating spice markets and legacy food lanes.", planningCost: 350, duration: "2 hours", coords: { lat: 28.6560, lng: 77.2300 } },
      { id: "lotus-temple", name: "Lotus Temple Bahá'í House of Worship", category: "Attraction", description: "Pure white marble temple shaped like a blooming lotus flower open to all faiths for silent meditation.", planningCost: 0, duration: "90 minutes", coords: { lat: 28.5535, lng: 77.2588 } },
      { id: "akshardham", name: "Swaminarayan Akshardham Complex", category: "Attraction", description: "Colossal modern Hindu temple of pink sandstone and marble with musical fountain and boat exhibitions.", planningCost: 250, duration: "Half day", coords: { lat: 28.6127, lng: 77.2773 } },
      { id: "rashtrapati-bhavan", name: "Rashtrapati Bhavan & Amrit Udyan", category: "Attraction", description: "Presidential palace designed by Edwin Lutyens featuring circular Mughal-style formal garden terraces.", planningCost: 50, duration: "2 hours", coords: { lat: 28.6143, lng: 77.1994 } },
      { id: "agrasen-ki-baoli", name: "Agrasen Ki Baoli Stepwell", category: "Hidden gem", description: "Atmospheric 14th-century 108-step historic stone stepwell hidden in the heart of modern Connaught Place.", planningCost: 0, duration: "45 minutes", coords: { lat: 28.6260, lng: 77.2250 } },
      { id: "national-museum-delhi", name: "National Museum Janpath", category: "Attraction", description: "India's greatest repository of Harappan Indus Valley relics, bronze Nataraja icons and miniature paintings.", planningCost: 100, duration: "3 hours", coords: { lat: 28.6118, lng: 77.2192 } },
    ],
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    region: "South",
    category: "City",
    image: images.bengaluru,
    description: "The Garden City of shaded canopies, historic botanical reserves and pioneering craft and coffee culture.",
    coords: { lat: 12.9716, lng: 77.5946 },
    tags: ["city", "food", "nature", "gardens", "architecture"],
    points: [
      { id: "cubbon-park", name: "Cubbon Park & Vidhana Soudha", category: "Attraction", description: "300-acre green lung in the city heart neighbouring Karnataka’s neo-Dravidian legislative palace.", planningCost: 50, duration: "2 hours", coords: { lat: 12.9763, lng: 77.5929 } },
      { id: "lalbagh", name: "Lalbagh Botanical Garden & Glass House", category: "Attraction", description: "240-acre botanical haven with centuries-old trees, lotus ponds and London Crystal Palace-inspired glasshouse.", planningCost: 100, duration: "2 hours", coords: { lat: 12.9507, lng: 77.5848 } },
      { id: "bangalore-palace", name: "Bangalore Palace Royal Estate", category: "Attraction", description: "Tudor-style royal residence with fortified towers, wooden carvings and antique royal portraits.", planningCost: 350, duration: "2 hours", coords: { lat: 12.9988, lng: 77.5921 } },
      { id: "tipu-summer-palace", name: "Tipu Sultan’s Summer Palace", category: "Attraction", description: "Two-storey teakwood palace built in 1791 featuring carved pillars, cusped arches and floral frescoes.", planningCost: 50, duration: "1 hour", coords: { lat: 12.9593, lng: 77.5737 } },
      { id: "bull-temple", name: "Bull Temple (Dodda Basavana Gudi)", category: "Attraction", description: "16th-century Vijayanagara monolithic Nandi statue carved out of a single granite boulder.", planningCost: 0, duration: "1 hour", coords: { lat: 12.9423, lng: 77.5683 } },
      { id: "nandi-hills", name: "Nandi Hills Sunrise Excursion", category: "Activity", description: "Ancient hilltop fortress 4,850 feet high offering breathtaking views of sea-of-clouds sunrises.", planningCost: 350, duration: "Half day", coords: { lat: 13.3702, lng: 77.6835 } },
      { id: "bannerghatta", name: "Bannerghatta Biological Park Safari", category: "Activity", description: "Protected wildlife sanctuary with open tiger and lion safaris, butterfly park and elephant sanctuary.", planningCost: 500, duration: "Half day", coords: { lat: 12.8009, lng: 77.5777 } },
      { id: "hal-museum", name: "HAL Heritage Centre & Aerospace Museum", category: "Attraction", description: "India's first aerospace museum showcasing indigenous fighter aircraft, helicopters and flight simulators.", planningCost: 150, duration: "2 hours", coords: { lat: 12.9550, lng: 77.6740 } },
      { id: "indiranagar-trail", name: "Indiranagar Craft & Filter Coffee Trail", category: "Activity", description: "Neighbourhood exploration blending traditional South Indian filter coffee with contemporary craft cafés.", planningCost: 400, duration: "2 hours", coords: { lat: 12.9784, lng: 77.6408 } },
      { id: "iskcon-bangalore", name: "ISKCON Sri Radha Krishna Temple", category: "Attraction", description: "Monumental hilltop temple complex in Rajajinagar blending traditional gopurams with modern glass architecture.", planningCost: 0, duration: "90 minutes", coords: { lat: 13.0098, lng: 77.5511 } },
    ],
  },
  {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    region: "South",
    category: "Culture",
    image: images.chennai,
    description: "The cultural gateway of South India celebrated for classical music, Dravidian temples and broad shorelines.",
    coords: { lat: 13.0827, lng: 80.2707 },
    tags: ["culture", "history", "beaches", "food", "architecture"],
    points: [
      { id: "marina-beach", name: "Marina Beach Promenade", category: "Attraction", description: "Expansive 13-kilometre Bay of Bengal shoreline popular for sunrise strolls and sundal stalls.", planningCost: 50, duration: "2 hours", coords: { lat: 13.0500, lng: 80.2824 } },
      { id: "kapaleeshwarar", name: "Kapaleeshwarar Temple & Mylapore", category: "Attraction", description: "7th-century Dravidian temple with rainbow-coloured gopuram and surrounding traditional tank streets.", planningCost: 50, duration: "2 hours", coords: { lat: 13.0334, lng: 80.2699 } },
      { id: "san-thome", name: "San Thome Cathedral Basilica", category: "Attraction", description: "Historic neo-Gothic Catholic basilica built over the tomb of St. Thomas the Apostle.", planningCost: 50, duration: "1 hour", coords: { lat: 13.0336, lng: 80.2783 } },
      { id: "dakshinachitra", name: "DakshinaChitra Heritage Village", category: "Activity", description: "Living open-air museum displaying authentic traditional houses, crafts and performing arts of South India.", planningCost: 250, duration: "3 hours", coords: { lat: 12.8252, lng: 80.2415 } },
      { id: "besant-nagar", name: "Besant Nagar Beach & Seaside Dining", category: "Activity", description: "Calmer coastal promenade around Elliot's Beach featuring fresh seafood and oceanview cafés.", planningCost: 300, duration: "2 hours", coords: { lat: 12.9997, lng: 80.2697 } },
      { id: "fort-st-george", name: "Fort St. George & Clive Collection", category: "Attraction", description: "First British fortress in India housing St. Mary’s Church and colonial military artifacts.", planningCost: 100, duration: "2 hours", coords: { lat: 13.0797, lng: 80.2874 } },
      { id: "guindy-park", name: "Guindy National Park & Snake Park", category: "Activity", description: "Rare inner-city protected forest hosting spotted deer, blackbucks and tropical tree species.", planningCost: 100, duration: "2 hours", coords: { lat: 13.0067, lng: 80.2206 } },
      { id: "kalakshetra", name: "Kalakshetra Foundation Arts Campus", category: "Hidden gem", description: "Eminent cultural academy for classical Bharatanatyam dance, music and traditional weaving.", planningCost: 150, duration: "2 hours", coords: { lat: 12.9904, lng: 80.2612 } },
      { id: "government-museum", name: "Government Museum & Bronze Gallery", category: "Attraction", description: "Second oldest museum in India celebrated for world-class Chola bronze sculptures.", planningCost: 100, duration: "2 hours", coords: { lat: 13.0694, lng: 80.2562 } },
      { id: "mahabalipuram", name: "Mahabalipuram UNESCO Shore Temples Excursion", category: "Attraction", description: "7th-century coastal rock-cut temples, giant bas-relief of Arjuna's Penance and shore sanctums.", planningCost: 600, duration: "Half day", coords: { lat: 12.6172, lng: 80.1927 } },
    ],
  },
  {
    id: "agra",
    name: "Agra",
    state: "Uttar Pradesh",
    region: "North",
    category: "Culture",
    image: images.agra,
    description: "An essential Mughal chapter with river-view monuments and craft-rich old-city lanes.",
    coords: { lat: 27.1767, lng: 78.0081 },
    tags: ["history", "culture", "photography", "family", "architecture"],
    points: [
      { id: "taj", name: "Taj Mahal Monument of Love", category: "Attraction", description: "World-famous white marble mausoleum beside the Yamuna River, breathtaking in morning light.", planningCost: 550, duration: "3 hours", coords: { lat: 27.1751, lng: 78.0421 } },
      { id: "agra-fort", name: "Agra Fort Mughal Citadel", category: "Attraction", description: "Massive red sandstone fortress containing royal palaces, Diwan-i-Khas and view of the Taj.", planningCost: 350, duration: "2 hours", coords: { lat: 27.1795, lng: 78.0211 } },
      { id: "fatehpur-sikri", name: "Fatehpur Sikri Imperial Ruins", category: "Attraction", description: "UNESCO fortified ghost city built by Akbar with Buland Darwaza and Salim Chishti shrine.", planningCost: 300, duration: "Half day", coords: { lat: 27.0945, lng: 77.6679 } },
      { id: "mehtab-bagh", name: "Mehtab Bagh Sunset Garden", category: "Activity", description: "Charbagh garden complex on the opposite riverbank providing serene sunset silhouettes of the Taj.", planningCost: 150, duration: "90 minutes", coords: { lat: 27.1800, lng: 78.0420 } },
      { id: "baby-taj", name: "Tomb of I'timad-ud-Daulah", category: "Attraction", description: "Exquisite jewel-box marble mausoleum often described as the draft or inspiration for the Taj.", planningCost: 150, duration: "1 hour", coords: { lat: 27.1929, lng: 78.0310 } },
      { id: "akbar-tomb", name: "Akbar’s Tomb Sikandra", category: "Attraction", description: "Red sandstone and white marble architectural masterpiece set inside lush deer parkland.", planningCost: 150, duration: "90 minutes", coords: { lat: 27.2206, lng: 77.9505 } },
      { id: "kinari-bazaar", name: "Kinari Bazaar Marble Artisans & Petha Trail", category: "Activity", description: "Narrow heritage market for marble inlay handicrafts, spices and famous Agra petha sweets.", planningCost: 250, duration: "2 hours", coords: { lat: 27.1856, lng: 78.0163 } },
      { id: "jama-masjid-agra", name: "Jama Masjid Agra Heritage Quarter", category: "Attraction", description: "17th-century mosque built by Shah Jahan for daughter Jahanara, facing Agra Fort.", planningCost: 50, duration: "1 hour", coords: { lat: 27.1834, lng: 78.0152 } },
      { id: "taj-nature-walk", name: "Taj Nature Walk Reserve", category: "Activity", description: "Serene 70-hectare woodland trail located 500 metres from the Taj eastern gate with elevated view mounds.", planningCost: 100, duration: "2 hours", coords: { lat: 27.1700, lng: 78.0510 } },
      { id: "chhatri-rani", name: "Chhatri of Rani Hada Red Stone Pavilion", category: "Hidden gem", description: "Rare Bundi architectural pavilion on the banks of Yamuna with carved pillared dome and river reflections.", planningCost: 0, duration: "45 minutes", coords: { lat: 27.1915, lng: 78.0335 } },
    ],
  },
  ...indiaCatalogue,
];

export function matchDestination(value: string | null | undefined): Destination | null {
  if (!value || typeof value !== "string") return null;
  let raw = value.trim();
  try {
    raw = decodeURIComponent(raw).trim();
  } catch {
    /* ignore */
  }
  if (!raw) return null;
  const clean = raw.toLowerCase();
  const slug = clean.replace(/[\s_]+/g, "-");

  // 1. Exact match by id (slug)
  const byId = destinations.find(d => d.id.toLowerCase() === slug || d.id.toLowerCase() === clean);
  if (byId) return byId;

  // 2. Exact match by name
  const byName = destinations.find(d => d.name.toLowerCase() === clean);
  if (byName) return byName;

  // 3. Exact match by state name (e.g. Telangana -> Hyderabad, Rajasthan -> Jaipur, West Bengal -> Kolkata)
  const byState = destinations.find(d => d.state && d.state.toLowerCase() === clean);
  if (byState) return byState;

  // 4. Name slug match
  const byNameSlug = destinations.find(d => d.name.toLowerCase().replace(/[\s_]+/g, "-") === slug);
  if (byNameSlug) return byNameSlug;

  // 5. State slug match
  const byStateSlug = destinations.find(d => d.state && d.state.toLowerCase().replace(/[\s_]+/g, "-") === slug);
  if (byStateSlug) return byStateSlug;

  // 6. Substring / partial match on name or state
  const bySub = destinations.find(d =>
    d.name.toLowerCase().includes(clean) ||
    clean.includes(d.name.toLowerCase()) ||
    (d.state && d.state.toLowerCase().includes(clean)) ||
    (d.state && clean.includes(d.state.toLowerCase()))
  );
  if (bySub) return bySub;

  return null;
}

export function getDestination(value: string | undefined): Destination {
  const matched = matchDestination(value);
  if (matched) return matched;
  return destinations[0];
}
