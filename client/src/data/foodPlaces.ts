export type FoodPlace = {
  id: string;
  name: string;
  destinationId: string;
  city: string;
  category: "Breakfast" | "Lunch" | "Dinner" | "Café & Bakery" | "Street Food & Snacks";
  specialties: string[];
  description: string;
  address: string;
  coords: { lat: number; lng: number };
  priceRange: "₹" | "₹₹" | "₹₹₹";
  famousFor: string;
};

export const foodPlaces: FoodPlace[] = [
  // ==================== GOA ====================
  {
    id: "goa-vinayak",
    name: "Vinayak Family Restaurant",
    destinationId: "goa",
    city: "Assagao, North Goa",
    category: "Lunch",
    specialties: ["Goan Fish Thali", "Rava Fried Chonak", "Crab Xacuti", "Prawn Masala"],
    description: "Beloved local institution tucked among Assagao fields renowned for its generous, authentic Goan seafood thali.",
    address: "House 252, Coutinho Vaddo, Assagao, Goa 403507",
    coords: { lat: 15.5898, lng: 73.7745 },
    priceRange: "₹₹",
    famousFor: "Unmatched fresh catch Goan fish thali and rava fried prawns"
  },
  {
    id: "goa-mums-kitchen",
    name: "Mum's Kitchen",
    destinationId: "goa",
    city: "Panaji, Central Goa",
    category: "Dinner",
    specialties: ["Pork Vindaloo", "Pomfret Caldin", "Crab Xec Xec", "Alle Belle"],
    description: "Award-winning heritage restaurant preserving endangered ancestral Goan Christian and Hindu homestyle recipes.",
    address: "854, Martinho de Noronha Road, Miramar, Panaji, Goa 403001",
    coords: { lat: 15.4835, lng: 73.8122 },
    priceRange: "₹₹₹",
    famousFor: "Authentic ancestral Goan heirloom curries and slow-cooked vindaloo"
  },
  {
    id: "goa-confeitaria-31",
    name: "Confeitaria 31 de Janeiro",
    destinationId: "goa",
    city: "Fontainhas, Panaji, Goa",
    category: "Café & Bakery",
    specialties: ["Traditional Bebinca", "Pastel de Nata", "Goan Poi Puffs", "Swiss Roll"],
    description: "Historic bakery operating since 1930 inside a heritage Portuguese lane, baking classic Goan sweets in traditional wood-fired ovens.",
    address: "Corte de Oiteiro, Fontainhas, Panaji, Goa 403001",
    coords: { lat: 15.4986, lng: 73.8272 },
    priceRange: "₹",
    famousFor: "Seven-layered Goan Bebinca and warm Portuguese custard tarts"
  },
  {
    id: "goa-martins-corner",
    name: "Martin's Corner",
    destinationId: "goa",
    city: "Betalbatim, South Goa",
    category: "Dinner",
    specialties: ["Butter Garlic King Crab", "Lobster Peri Peri", "Pork Ribs", "Fish Balchão"],
    description: "Legendary South Goa culinary destination celebrated for live coastal music, warm hospitality, and giant spiced seafood platters.",
    address: "Binwaddo, Betalbatim, Salcete, Goa 403713",
    coords: { lat: 15.2974, lng: 73.9189 },
    priceRange: "₹₹₹",
    famousFor: "Iconic South Goan butter garlic seafood and lively beach-village atmosphere"
  },
  {
    id: "goa-ritz-classic",
    name: "Ritz Classic",
    destinationId: "goa",
    city: "Panaji, Central Goa",
    category: "Lunch",
    specialties: ["Kingfish Thali", "Tisreo Sukhem (Clams)", "Squid Fry", "Sol Kadi"],
    description: "The gold standard for weekday business and family seafood lunches in the capital, bustling with daily local diners.",
    address: "1st Floor, Wagle Vision, 18th June Road, Panaji, Goa 403001",
    coords: { lat: 15.4952, lng: 73.8256 },
    priceRange: "₹₹",
    famousFor: "The benchmark Panaji executive seafood thali with freshly ground kadi"
  },
  {
    id: "goa-infantaria",
    name: "Infantaria Bakery & Café",
    destinationId: "goa",
    city: "Calangute-Baga",
    category: "Breakfast",
    specialties: ["Goan Sausage Poi", "English Breakfast", "Croissants", "Filter Coffee"],
    description: "Iconic Calangute junction café bustling since morning for fresh bakery goods, continental breakfast, and spicy chorizo poi.",
    address: "5/181, Umtavaddo, Calangute-Baga Road, Goa 403516",
    coords: { lat: 15.5412, lng: 73.7554 },
    priceRange: "₹₹",
    famousFor: "Morning breakfast spread and spicy Goan chorizo bread"
  },
  {
    id: "goa-baba-au-rhum",
    name: "Baba Au Rhum",
    destinationId: "goa",
    city: "Anjuna, North Goa",
    category: "Breakfast",
    specialties: ["Croissant Sandwiches", "Eggs Benedict", "Quiche Lorraine", "Artisan Espresso"],
    description: "Legendary open-air bakery café set under bamboo groves by Anjuna fields, baking French viennoiserie and sourdough since morning.",
    address: "House 1054, Sim Vaddo, Anjuna, Goa 403509",
    coords: { lat: 15.5840, lng: 73.7530 },
    priceRange: "₹₹",
    famousFor: "French bakery breakfasts, flaky butter croissants and espresso under forest canopies"
  },
  {
    id: "goa-artjuna",
    name: "Artjuna Garden Café",
    destinationId: "goa",
    city: "Anjuna, North Goa",
    category: "Breakfast",
    specialties: ["Shakshuka", "Avocado Toast", "Tahini Smoothie Bowls", "Fresh Mango Lassi"],
    description: "Breezy Mediterranean garden café in an old Portuguese bungalow serving wholesome morning spreads, freshly squeezed juices, and artisan bread.",
    address: "940, Market Road, Monteiro Vaddo, Anjuna, Goa 403509",
    coords: { lat: 15.5780, lng: 73.7445 },
    priceRange: "₹₹",
    famousFor: "Healthy garden breakfasts, authentic shakshuka, and relaxed boho vibes"
  },
  {
    id: "goa-caravela-cafe",
    name: "Caravela Café & Bistro",
    destinationId: "goa",
    city: "Fontainhas, Panaji, Goa",
    category: "Breakfast",
    specialties: ["Goan Poee Breakfast", "Pancakes with Wild Honey", "Rissóis de Camarão", "Fresh Roasted Latin Coffee"],
    description: "Intimate Latin Quarter bistro known for house-roasted single origin coffee, Portuguese pastries, and hearty morning poee spreads.",
    address: "27, 31st January Road, Fontainhas, Panaji, Goa 403001",
    coords: { lat: 15.4980, lng: 73.8285 },
    priceRange: "₹₹",
    famousFor: "Artisanal Goan-Portuguese breakfasts and heritage roast espresso in Fontainhas"
  },
  {
    id: "goa-fat-fish",
    name: "Fat Fish",
    destinationId: "goa",
    city: "Arpora, Baga Creek, Goa",
    category: "Lunch",
    specialties: ["Special Goan Fish Thali", "Kingfish Rava Fry", "Stuffed Crab", "Prawn Curry Rice"],
    description: "High-energy open-air dining hall overlooking Baga Creek paddy fields serving Goan thalis with multiple seafood accompaniments.",
    address: "Agar Vaddo, Calangute-Arpora Road, Arpora, Goa 403516",
    coords: { lat: 15.5680, lng: 73.7630 },
    priceRange: "₹₹",
    famousFor: "Generous multi-bowl Goan seafood thalis and crispy squid"
  },
  {
    id: "goa-gunpowder",
    name: "Gunpowder",
    destinationId: "goa",
    city: "Assagao, North Goa",
    category: "Dinner",
    specialties: ["Kerala Mushroom Fry", "Appam & Stew", "Andhra Prawn Curry", "Sol Kadi"],
    description: "Atmospheric courtyard dining inside an old heritage home in bohemian Assagao, serving coastal peninsular South Indian delicacies under paper lanterns.",
    address: "Saunto Vaddo, Assagao, Goa 403507",
    coords: { lat: 15.5925, lng: 73.7780 },
    priceRange: "₹₹₹",
    famousFor: "Lace appams, malabar curries, and atmospheric heritage courtyard dinners"
  },

  // ==================== HYDERABAD ====================
  {
    id: "hyd-hotel-shadab",
    name: "Hotel Shadab",
    destinationId: "hyderabad",
    city: "Old City, Hyderabad",
    category: "Lunch",
    specialties: ["Mutton Dum Biryani", "Mutton Marag", "Shikampur Kebab", "Nalli Nihari"],
    description: "Iconic Old City destination near Charminar where huge copper degs produce Hyderabad's most aromatic traditional kacchi mutton biryani.",
    address: "High Court Road, Madina Circle, Ghansi Bazaar, Hyderabad 500002",
    coords: { lat: 17.3685, lng: 78.4728 },
    priceRange: "₹₹",
    famousFor: "Authentic Deccani mutton dum biryani and slow-cooked marag soup"
  },
  {
    id: "hyd-nimrah-cafe",
    name: "Nimrah Café & Bakery",
    destinationId: "hyderabad",
    city: "Charminar, Hyderabad",
    category: "Street Food & Snacks",
    specialties: ["Irani Chai", "Osmania Biscuits", "Tie Biscuits", "Khari Puff"],
    description: "Legendary heritage tea stall directly facing the grand Charminar arches, celebrated for slow-brewed creamy Irani chai and hot biscuits.",
    address: "Beside Mecca Masjid, Charminar, Hyderabad 500002",
    coords: { lat: 17.3618, lng: 78.4745 },
    priceRange: "₹",
    famousFor: "The definitive Hyderabadi Irani chai paired with crumbly Osmania biscuits"
  },
  {
    id: "hyd-bawarchi",
    name: "Bawarchi Restaurant",
    destinationId: "hyderabad",
    city: "RTC X Roads, Hyderabad",
    category: "Dinner",
    specialties: ["Special Chicken Biryani", "Mutton Boti Kebab", "Mirchi Ka Salan", "Double Ka Meetha"],
    description: "A cultural culinary landmark famous for generous portions of rich, fragrant biryani cooked over charcoal fires.",
    address: "RTC X Roads, Chikkadpally, Hyderabad 500020",
    coords: { lat: 17.4045, lng: 78.4975 },
    priceRange: "₹₹",
    famousFor: "Deeply flavourful charcoal-cooked biryani and classic salan"
  },
  {
    id: "hyd-chutneys",
    name: "Chutneys",
    destinationId: "hyderabad",
    city: "Banjara Hills, Hyderabad",
    category: "Breakfast",
    specialties: ["Babai Idli", "Guntur Idli", "7-Chutney Platter", "MLA Pesarattu"],
    description: "Renowned vegetarian breakfast institution serving melt-in-mouth steamed idlis paired with six distinct freshly ground house chutneys.",
    address: "Road No. 1, Banjara Hills, Hyderabad 500034",
    coords: { lat: 17.4172, lng: 78.4485 },
    priceRange: "₹₹",
    famousFor: "Signature 6-chutney platter with butter-drenched Babai idli"
  },
  {
    id: "hyd-subhan-bakery",
    name: "Subhan Bakery",
    destinationId: "hyderabad",
    city: "Nampally, Hyderabad",
    category: "Café & Bakery",
    specialties: ["Original Osmania Biscuits", "Dum Ke Roat", "Chand Biscuits", "Fruit Cake"],
    description: "Historic 1890 bakery that first standardized the Osmania biscuit recipe, beloved by royal patrons and generations of locals.",
    address: "11-6-465, Nampally Market, Hyderabad 500001",
    coords: { lat: 17.3875, lng: 78.4682 },
    priceRange: "₹",
    famousFor: "The ancestral birthplace of packaged Osmania biscuits and Muharram Dum Ke Roat"
  },
  {
    id: "hyd-govind-bandi",
    name: "Govind Ki Bandi",
    destinationId: "hyderabad",
    city: "Ghansi Bazaar, Hyderabad",
    category: "Breakfast",
    specialties: ["Butter Tawa Idli", "Tawa Dosa", "Upma Dosa", "Karam Podi Butter"],
    description: "Legendary dawn street cart where thousands flock early morning for tawa-fried spicy butter idlis sizzling with podi and coriander.",
    address: "Gulzar Houz, Ghansi Bazaar, Hyderabad 500002",
    coords: { lat: 17.3645, lng: 78.4748 },
    priceRange: "₹",
    famousFor: "Piping-hot spiced butter tawa idlis fresh off the iron griddle"
  },

  // ==================== JAIPUR ====================
  {
    id: "jpr-lmb",
    name: "Laxmi Mishthan Bhandar (LMB)",
    destinationId: "jaipur",
    city: "Johari Bazaar, Jaipur",
    category: "Lunch",
    specialties: ["Rajasthani Royal Thali", "Paneer Ghewar", "Pyaz Ki Kachori", "Doodh Laddoo"],
    description: "Historic 1727 confectioner and thali restaurant in the walled Pink City, world-renowned for its honeycomb ghewar.",
    address: "98-101, Johari Bazaar, Pink City, Jaipur 302003",
    coords: { lat: 26.9205, lng: 75.8252 },
    priceRange: "₹₹₹",
    famousFor: "Legendary golden honeycomb Paneer Ghewar and traditional Rajasthani thali"
  },
  {
    id: "jpr-rawat",
    name: "Rawat Mishthan Bhandar",
    destinationId: "jaipur",
    city: "Station Road, Jaipur",
    category: "Breakfast",
    specialties: ["Mawa Kachori", "Pyaz Ki Kachori", "Mirchi Vada", "Jalebi"],
    description: "Celebrated snack empire where over ten thousand crisp, flaky onion kachoris are fried daily in desi ghee.",
    address: "Station Road, Sindhi Camp, Jaipur 302001",
    coords: { lat: 26.9235, lng: 75.7985 },
    priceRange: "₹",
    famousFor: "India's most famous spicy Pyaz Ki Kachori and sweet Mawa Kachori"
  },
  {
    id: "jpr-handi",
    name: "Handi Restaurant",
    destinationId: "jaipur",
    city: "MI Road, Jaipur",
    category: "Dinner",
    specialties: ["Laal Maas", "Handi Meat", "Rumali Roti", "Galouti Kebab"],
    description: "Prominent Rajasthani dining institution renowned for authentic fiery Mathania red chilli Laal Maas slow-cooked in clay pots.",
    address: "Maya Mansion, Opposite GPO, MI Road, Jaipur 302001",
    coords: { lat: 26.9175, lng: 75.8075 },
    priceRange: "₹₹",
    famousFor: "Authentic Rajput-style clay pot Laal Maas and smoked kebabs"
  },
  {
    id: "jpr-gulab-ji",
    name: "Gulab Ji Chai Wale",
    destinationId: "jaipur",
    city: "MI Road, Jaipur",
    category: "Street Food & Snacks",
    specialties: ["Masala Chai", "Bun Maska Samosa", "Kachori Chutney"],
    description: "70-year-old street tea stall drawing prime ministers, film stars, and early morning locals for cardamom ginger tea and bun maska.",
    address: "Ganpati Plaza, MI Road, Jaipur 302001",
    coords: { lat: 26.9189, lng: 75.8032 },
    priceRange: "₹",
    famousFor: "Rich aromatic masala chai paired with warm bun maska stuffed with crisp samosa"
  },
  {
    id: "jpr-samrat",
    name: "Samrat Restaurant",
    destinationId: "jaipur",
    city: "Chaura Rasta, Jaipur",
    category: "Breakfast",
    specialties: ["Hot Pyaz Kachori", "Crisp Jalebi", "Masala Chai", "Dhokla"],
    description: "Famous walled city morning landmark since 1965 serving piping hot samosas, crispy golden jalebis, and fragrant tea to early market traders.",
    address: "Chaura Rasta, Modikhana, Jaipur 302003",
    coords: { lat: 26.9195, lng: 75.8210 },
    priceRange: "₹",
    famousFor: "Signature morning crispy jalebis and piping hot pyaz kachori"
  },
  {
    id: "jpr-niros",
    name: "Niros Restaurant",
    destinationId: "jaipur",
    city: "MI Road, Jaipur",
    category: "Dinner",
    specialties: ["Junglee Maas", "Butter Chicken", "Reshmi Kebab", "Pindi Chana"],
    description: "Iconic colonial-era establishment opened in 1949, cherished by royal families, international diplomats, and generations of food lovers.",
    address: "MI Road, Jaipur 302001",
    coords: { lat: 26.9168, lng: 75.8080 },
    priceRange: "₹₹₹",
    famousFor: "Historic culinary excellence since 1949 with signature Rajput Junglee Maas"
  },
  {
    id: "jpr-tattoo-cafe",
    name: "The Tattoo Cafe & Lounge",
    destinationId: "jaipur",
    city: "Opposite Hawa Mahal, Jaipur",
    category: "Café & Bakery",
    specialties: ["Wood-fired Pizza", "Artisan Coffee", "Cold Brew", "Falafel Platter"],
    description: "Panoramic rooftop terrace café positioned directly opposite Hawa Mahal's honeycomb facade with unrivaled sunrise and sunset photography angles.",
    address: "3rd Floor, Opposite Hawa Mahal, Badi Chaupar, Jaipur 302002",
    coords: { lat: 26.9240, lng: 75.8270 },
    priceRange: "₹₹",
    famousFor: "Unobstructed rooftop balcony views of Hawa Mahal paired with specialty coffees"
  },
  {
    id: "jpr-1135-ad",
    name: "1135 AD Amer",
    destinationId: "jaipur",
    city: "Amer Fort, Jaipur",
    category: "Dinner",
    specialties: ["Thali of the Maharajas", "Lal Maas", "Murgh Sula", "Badam Halwa"],
    description: "Magnificent fine-dining royal salon set inside the historic battlements of Amer Fort with silver dinnerware, antique chandeliers, and regal ambiance.",
    address: "Level 2, Jaleb Chowk, Amer Fort, Jaipur 302028",
    coords: { lat: 26.9855, lng: 75.8510 },
    priceRange: "₹₹₹",
    famousFor: "Opulent regal palace dining inside Amer Fort with live classical santoor"
  },
  {
    id: "jpr-pandit-pav-bhaji",
    name: "Pandit Pav Bhaji",
    destinationId: "jaipur",
    city: "Birla Mandir, Jaipur",
    category: "Street Food & Snacks",
    specialties: ["Butter Pav Bhaji", "Tawa Pulao", "Masala Buttermilk"],
    description: "Legendary street food hotspot opposite Birla Mandir renowned for rich, buttery mashed spiced vegetables cooked over giant cast-iron tawas.",
    address: "JLN Marg, Opposite Birla Temple, Tilak Nagar, Jaipur 302004",
    coords: { lat: 26.8925, lng: 75.8155 },
    priceRange: "₹",
    famousFor: "Extra-butter street pav bhaji and aromatic tawa pulao"
  },

  // ==================== KERALA ====================
  {
    id: "ker-paragon",
    name: "Paragon Restaurant",
    destinationId: "kerala",
    city: "Kozhikode / Ernakulam",
    category: "Lunch",
    specialties: ["Malabar Mutton Biryani", "Mango Fish Curry", "Karimeen Pollichathu", "Coin Parotta"],
    description: "Internationally acclaimed culinary flagship ranked among the world's most legendary heritage restaurants by TasteAtlas.",
    address: "Lulu Mall / Aster Medcity Rd, Edappally, Kochi, Kerala 682024",
    coords: { lat: 10.0275, lng: 76.3085 },
    priceRange: "₹₹",
    famousFor: "World-celebrated Malabar Dum Biryani and clay-pot mango fish curry"
  },
  {
    id: "ker-grand-pavilion",
    name: "Grand Pavilion",
    destinationId: "kerala",
    city: "MG Road, Kochi",
    category: "Dinner",
    specialties: ["Karimeen Pollichathu", "Syrian Beef Fry", "Kerala Parotta", "Meen Moilee"],
    description: "Beloved heritage dining room since 1963 serving classic central Travancore Christian and coastal Kerala specialties.",
    address: "Grand Hotel, MG Road, Ernakulam, Kochi 682011",
    coords: { lat: 9.9675, lng: 76.2845 },
    priceRange: "₹₹₹",
    famousFor: "Banana leaf wrapped spicy pearl spot fish (Karimeen Pollichathu)"
  },
  {
    id: "ker-kashi-art",
    name: "Kashi Art Café",
    destinationId: "kerala",
    city: "Fort Kochi",
    category: "Café & Bakery",
    specialties: ["Artisanal Cold Brew", "Fluffy Cheese Omelette", "Moist Chocolate Cake", "Homemade Granola"],
    description: "Bohemian open-roof courtyard art gallery and café serving organic Western Ghats coffee and wholesome European-Kerala breakfast.",
    address: "Burger Street, Fort Kochi, Kochi 682001",
    coords: { lat: 9.9648, lng: 76.2435 },
    priceRange: "₹₹",
    famousFor: "Courtyard art exhibitions paired with artisan coffee and decadent chocolate cake"
  },
  {
    id: "ker-dhe-puttu",
    name: "Dhe Puttu",
    destinationId: "kerala",
    city: "Edappally, Kochi, Kerala",
    category: "Breakfast",
    specialties: ["Irachi Puttu (Meat)", "Kadala Curry", "Fish Puttu", "Jackfruit Puttu"],
    description: "Specialty culinary concept celebrating Kerala's staple steamed rice cylinders with over thirty sweet and savoury fillings.",
    address: "NH Bypass, Near Oberon Mall, Edappally, Kochi 682024",
    coords: { lat: 10.0095, lng: 76.3120 },
    priceRange: "₹₹",
    famousFor: "Innovative and traditional steamed puttu with rich spicy curries"
  },
  {
    id: "ker-villa-maya",
    name: "Villa Maya Heritage Dining",
    destinationId: "kerala",
    city: "Trivandrum, South Kerala",
    category: "Dinner",
    specialties: ["Travancore Prawn Roast", "Aleppey Fish Curry", "Appam with Stew", "Elaneer Payasam"],
    description: "Restored 18th-century Dutch manor house once belonging to Travancore royalty, renowned for exquisite coastal Kerala delicacies.",
    address: "120, Airport Road, Shankumugham, Thiruvananthapuram 695008",
    coords: { lat: 8.4905, lng: 76.9215 },
    priceRange: "₹₹₹",
    famousFor: "Royal Travancore heirloom seafood curries served in an illuminated 18th-century courtyard"
  },
  {
    id: "ker-mothers-veg",
    name: "Mothers Veg Plaza",
    destinationId: "kerala",
    city: "Bakery Junction, Trivandrum, Kerala",
    category: "Lunch",
    specialties: ["Grand Kerala Sadhya", "Ada Pradhaman", "Avial", "Pineapple Pachadi"],
    description: "Legendary dining hall celebrated across southern Kerala for serving authentic 30-dish traditional wedding sadhyas on fresh plantain leaves.",
    address: "Near Russian Cultural Centre, Bakery Junction, Thiruvananthapuram 695034",
    coords: { lat: 8.5020, lng: 76.9535 },
    priceRange: "₹₹",
    famousFor: "The most authentic unlimited multi-course Travancore banana leaf Sadhya in the state"
  },
  {
    id: "ker-thaff-alleppey",
    name: "Mullakkal Thaff Restaurant",
    destinationId: "kerala",
    city: "Mullakkal, Alappuzha, Kerala",
    category: "Lunch",
    specialties: ["Karimeen Pollichathu", "Alleppey Fish Curry", "Kerala Parotta", "Duck Roast"],
    description: "Celebrated canal-side restaurant in Alappuzha known for fresh backwater catch and authentic Travancore-style curries.",
    address: "Mullakkal Road, Alappuzha, Kerala 688011",
    coords: { lat: 9.4925, lng: 76.3325 },
    priceRange: "₹₹",
    famousFor: "Authentic Alleppey backwater fish curry and crispy Karimeen fry"
  },
  {
    id: "ker-rapsy-munnar",
    name: "Rapsy Restaurant",
    destinationId: "kerala",
    city: "Main Bazaar, Munnar, Kerala",
    category: "Lunch",
    specialties: ["Malabar Chicken Roast", "Spanish Omelette", "Kerala Parotta", "Cardamom Spiced Tea"],
    description: "Legendary high-range restaurant in Munnar town serving piping-hot parottas, flavorful roast curries, and traveler favorites since 1982.",
    address: "Main Bazaar, Munnar, Kerala 685612",
    coords: { lat: 10.0872, lng: 77.0601 },
    priceRange: "₹₹",
    famousFor: "Signature Malabar roast curries and flaky Kerala parottas amidst mist-cooled hills"
  },
  {
    id: "ker-bamboo-thekkady",
    name: "Bamboo Café & Spice Kitchen",
    destinationId: "kerala",
    city: "Thekkady, Kumily, Kerala",
    category: "Lunch",
    specialties: ["Syrian Beef Fry", "Appam with Stew", "Cardamom Tea", "Pineapple Curry"],
    description: "Atmospheric spice plantation café near the Periyar tiger reserve entrance, renowned for slow-cooked Syrian Christian family recipes.",
    address: "By-Pass Road, Thekkady, Kumily, Kerala 685509",
    coords: { lat: 9.6050, lng: 77.1650 },
    priceRange: "₹₹",
    famousFor: "Farm-to-table organic spice curries and fluffy appams near Periyar"
  },
  {
    id: "ker-1980s-wayanad",
    name: "1980's A Nostalgic Restaurant",
    destinationId: "kerala",
    city: "Kalpetta, Wayanad, Kerala",
    category: "Lunch",
    specialties: ["Wayanad Bamboo Puttu", "Kanthari Fish Curry", "Pathiri", "Nadan Chicken Fry"],
    description: "Award-winning heritage eatery celebrating tribal and ethnic Wayanad cuisine served inside an antique wooden farmhouse.",
    address: "National Highway 766, Kalpetta, Wayanad, Kerala 673121",
    coords: { lat: 11.6080, lng: 76.0820 },
    priceRange: "₹₹",
    famousFor: "Traditional tribal Wayanadan bamboo puttu and fiery bird's eye chili (kanthari) curries"
  },
  {
    id: "ker-curry-leaf-kovalam",
    name: "Curry Leaf Seafood Restaurant",
    destinationId: "kerala",
    city: "Lighthouse Beach, Kovalam, Kerala",
    category: "Dinner",
    specialties: ["Tiger Prawn Tawa Fry", "Crab Masala", "Grilled Kingfish", "Coconut Rice"],
    description: "Beachfront seafood deck overlooking Kovalam's illuminated lighthouse, serving ocean-fresh catch prepared with freshly pressed coconut milk.",
    address: "Lighthouse Beach Promenade, Kovalam, Kerala 695521",
    coords: { lat: 8.3995, lng: 76.9790 },
    priceRange: "₹₹",
    famousFor: "Sunset beachside grilled seafood and freshly spiced tawa tiger prawns"
  },

  // ==================== MUMBAI ====================
  {
    id: "mum-britannia",
    name: "Britannia & Co. Restaurant",
    destinationId: "mumbai",
    city: "Ballard Estate, South Mumbai",
    category: "Lunch",
    specialties: ["Berry Pulao", "Sali Boti", "Caramel Custard", "Dhansak"],
    description: "Quintessential 1923 colonial Parsi café renowned for its zesty Iranian barberry mutton pulao and vintage atmosphere.",
    address: "Wakefield House, 11 Sprott Road, Ballard Estate, Fort, Mumbai 400001",
    coords: { lat: 18.9352, lng: 72.8402 },
    priceRange: "₹₹₹",
    famousFor: "Legendary Parsi-Iranian Mutton Berry Pulao and rich caramel custard"
  },
  {
    id: "mum-ashok-vada-pav",
    name: "Ashok Vada Pav (Kirti College)",
    destinationId: "mumbai",
    city: "Dadar West, Mumbai",
    category: "Street Food & Snacks",
    specialties: ["Kirti Vada Pav", "Crunchy Chura Pav", "Garlic Chutney"],
    description: "Mumbai's gold standard street kiosk operating since 1967, famous for golden crunchy besan crispies layered over spiced potato patties.",
    address: "Cadel Road, Off Veer Savarkar Marg, Dadar West, Mumbai 400028",
    coords: { lat: 19.0195, lng: 72.8312 },
    priceRange: "₹",
    famousFor: "Widely regarded as the single finest vada pav in Mumbai"
  },
  {
    id: "mum-kyani",
    name: "Kyani & Co.",
    destinationId: "mumbai",
    city: "Dhobi Talao / Marine Lines",
    category: "Breakfast",
    specialties: ["Bun Maska & Irani Chai", "Kheema Pav", "Mawa Cake", "Akuri on Toast"],
    description: "Mumbai's oldest operating Irani café (established 1904) with bentwood chairs, checkered tablecloths, and fresh bakery counter.",
    address: "Jermahal Estate, 657, JSS Road, Dhobi Talao, Marine Lines, Mumbai 400002",
    coords: { lat: 18.9445, lng: 72.8275 },
    priceRange: "₹",
    famousFor: "Historic century-old bun maska dipped in sweet milky Irani chai"
  },
  {
    id: "mum-trishna",
    name: "Trishna Restaurant",
    destinationId: "mumbai",
    city: "Kala Ghoda, Fort",
    category: "Dinner",
    specialties: ["Butter Garlic King Crab", "Koliwada Prawns", "Neer Dosa", "Hyderabadi Fish"],
    description: "World-celebrated coastal seafood institution in the art district, renowned among international chefs for jumbo sea crabs.",
    address: "Sai Baba Mandir Marg, Kala Ghoda, Fort, Mumbai 400001",
    coords: { lat: 18.9285, lng: 72.8325 },
    priceRange: "₹₹₹",
    famousFor: "World-renowned sweet and savoury butter garlic mud crab"
  },

  // ==================== DELHI ====================
  {
    id: "del-karims",
    name: "Karim's Historic Old Delhi",
    destinationId: "delhi",
    city: "Jama Masjid, Old Delhi",
    category: "Dinner",
    specialties: ["Mutton Korma", "Mutton Burra Kebab", "Seekh Kebab", "Sheermal"],
    description: "Established in 1913 by royal chefs of the last Mughal emperor Bahadur Shah Zafar, serving legendary royal Mughlai meat dishes.",
    address: "16, Gali Kababian, Jama Masjid, Old Delhi 110006",
    coords: { lat: 28.6508, lng: 77.2348 },
    priceRange: "₹₹",
    famousFor: "Historic royal Mughal mutton korma and charcoal-charred burra kebabs"
  },
  {
    id: "del-paranthe-wali-gali",
    name: "Pt. Gaya Prasad Shiv Charan Paranthe Wale",
    destinationId: "delhi",
    city: "Chandni Chowk, Old Delhi",
    category: "Lunch",
    specialties: ["Rabdi Parantha", "Khoya Parantha", "Mirchi Parantha", "Aloo Matar Sabzi"],
    description: "Operational since 1872 in Old Delhi's famed lane, deep-frying stuffed flaky flatbreads in pure desi ghee served with sweet pumpkin curry.",
    address: "34, Paranthe Wali Gali, Chandni Chowk, Delhi 110006",
    coords: { lat: 28.6562, lng: 77.2305 },
    priceRange: "₹",
    famousFor: "Heritage 150-year-old deep-fried stuffed paranthas and tamarind-banana chutney"
  },
  {
    id: "del-saravana-bhavan",
    name: "Saravana Bhavan (Janpath)",
    destinationId: "delhi",
    city: "Connaught Place, New Delhi",
    category: "Breakfast",
    specialties: ["Ghee Roast Dosa", "Mini Ghee Idli Sambar", "Rava Khichdi", "Filter Coffee"],
    description: "Capital's premier breakfast destination for pristine South Indian vegetarian fare, always humming with morning patrons.",
    address: "46, Janpath Road, Connaught Place, New Delhi 110001",
    coords: { lat: 28.6295, lng: 77.2185 },
    priceRange: "₹₹",
    famousFor: "Crisp golden ghee roast dosa and aromatic South Indian degree coffee"
  },
  {
    id: "del-wengers",
    name: "Wenger's Deli & Confectionery",
    destinationId: "delhi",
    city: "Connaught Place, New Delhi",
    category: "Café & Bakery",
    specialties: ["Mutton Shami Patty", "Chicken Patties", "Nutella Waffles", "Black Forest Cake"],
    description: "Delhi's oldest Swiss confectionery (est. 1926) producing colonial-era savoury patties, cream buns, and hot espresso.",
    address: "A-16, Radial Road 3, Connaught Place, New Delhi 110001",
    coords: { lat: 28.6335, lng: 77.2198 },
    priceRange: "₹",
    famousFor: "Century-old heritage flaky mutton and chicken patties"
  },

  // ==================== CHENNAI ====================
  {
    id: "chn-murugan-idli",
    name: "Murugan Idli Shop",
    destinationId: "chennai",
    city: "T. Nagar, Chennai",
    category: "Breakfast",
    specialties: ["Mallipoo Soft Idlis", "Ghee Podi Dosa", "Jigarthanda", "Tomato Chutney"],
    description: "Celebrated Madurai-origin tiffin chain world-famous for cloud-soft jasmine flower idlis served with four distinct coconut chutneys.",
    address: "77-1/A, G.N. Chetty Road, T. Nagar, Chennai 600017",
    coords: { lat: 13.0425, lng: 78.2385 },
    priceRange: "₹",
    famousFor: "Incomparably soft steaming idlis drizzled with aromatic spicy gunpowder podi"
  },
  {
    id: "chn-ratna-cafe",
    name: "Ratna Café",
    destinationId: "chennai",
    city: "Triplicane, Chennai",
    category: "Lunch",
    specialties: ["Sambar Idli (Unlimited)", "Crispy Medu Vada", "Poori Masala", "Degree Filter Coffee"],
    description: "1948 culinary temple in historic Triplicane where waiters carry large jugs pouring endless ladles of iconic mildly sweet, spicy sambar.",
    address: "255, Triplicane High Road, Triplicane, Chennai 600005",
    coords: { lat: 13.0565, lng: 78.2755 },
    priceRange: "₹",
    famousFor: "Famous unlimited sambar poured over submerged hot idlis"
  },

  // ==================== AMRITSAR ====================
  {
    id: "asr-kesar-da-dhaba",
    name: "Kesar Da Dhaba",
    destinationId: "amritsar",
    city: "Chowk Passian, Old Amritsar",
    category: "Dinner",
    specialties: ["Dal Makhani (Maa Ki Dal)", "Palak Paneer", "Lachha Paratha", "Phirni"],
    description: "Legendary 1916 culinary shrine where black lentils are slow-simmered for 24 hours over coal fires and finished with desi ghee tadka.",
    address: "Chowk Passian, Near Telephone Exchange, Old Amritsar 143001",
    coords: { lat: 28.6255, lng: 74.8735 },
    priceRange: "₹₹",
    famousFor: "The world's benchmark 24-hour slow-cooked Punjabi Dal Makhani"
  },
  {
    id: "asr-kulcha-land",
    name: "Bhai Kulwant Singh Kulchian Wale",
    destinationId: "amritsar",
    city: "Bazaar Kathian, Near Golden Temple",
    category: "Breakfast",
    specialties: ["Aloo Pyaz Amritsari Kulcha", "Paneer Kulcha", "Pindi Chole", "Imli Pyaz Chutney"],
    description: "Generational tandoor masters baking multi-layered, crumbly potato kulchas crushed by hand with melting butter.",
    address: "Near Golden Temple Main Entrance, Bazaar Kathian, Amritsar 143006",
    coords: { lat: 28.6212, lng: 74.8775 },
    priceRange: "₹",
    famousFor: "Crispy tandoori clay-oven Amritsari kulchas served with spicy chickpeas"
  },
  {
    id: "asr-gurdasram-jalebi",
    name: "Gurdas Ram Jalebi Wale",
    destinationId: "amritsar",
    city: "Katara Ahluwalia, Amritsar",
    category: "Street Food & Snacks",
    specialties: ["Desi Ghee Jalebi", "Crispy Imarti", "Hot Rabdi"],
    description: "Famous heritage sweet kiosk frying golden spirals of fermented batter in bubbling pure ghee before soaking in saffron syrup.",
    address: "Chowk Katara Ahluwalia, Amritsar 143001",
    coords: { lat: 28.6225, lng: 74.8755 },
    priceRange: "₹",
    famousFor: "Freshly made hot desi ghee jalebis crisp outside and dripping with syrup"
  },

  // ==================== KOLKATA ====================
  {
    id: "ccu-peter-cat",
    name: "Peter Cat",
    destinationId: "kolkata",
    city: "Park Street, Kolkata",
    category: "Dinner",
    specialties: ["Chelo Kebab", "Mutton Barra", "Cocktails", "Caramel Custard"],
    description: "Kolkata's most beloved heritage dining room with low lighting and liveried staff, renowned for its iconic Iranian-style Chelo Kebab.",
    address: "18A, Park Street, Park Street Area, Kolkata 700016",
    coords: { lat: 22.5515, lng: 78.3532 },
    priceRange: "₹₹₹",
    famousFor: "The iconic Kolkata Chelo Kebab served with melting butter and poached egg"
  },
  {
    id: "ccu-flurys",
    name: "Flurys Tearoom",
    destinationId: "kolkata",
    city: "Park Street, Kolkata",
    category: "Breakfast",
    specialties: ["English Breakfast", "Rum Balls", "Darjeeling Tea", "Chocolate Boat"],
    description: "Quintessential 1927 European tearoom patronized by generations of Kolkata intellectuals, artists, and morning walkers.",
    address: "18, Park Street, Kolkata 700071",
    coords: { lat: 22.5520, lng: 78.3528 },
    priceRange: "₹₹",
    famousFor: "Colonial English breakfast spread and legendary chocolate rum balls"
  },
  {
    id: "ccu-balaram-mullick",
    name: "Balaram Mullick & Radharaman Mullick",
    destinationId: "kolkata",
    city: "Bhowanipore, Kolkata",
    category: "Café & Bakery",
    specialties: ["Baked Rosogolla", "Nolen Gur Sandesh", "Mishti Doi", "Jolbhora Sandesh"],
    description: "Operating since 1885, pioneers of artisanal Bengali sweet craftsmanship utilizing winter date palm jaggery (nolen gur).",
    address: "2, Paddapukur Road, Jadubabur Bazar, Bhowanipore, Kolkata 700020",
    coords: { lat: 22.5325, lng: 78.3490 },
    priceRange: "₹",
    famousFor: "Warm caramelized Baked Rosogolla and seasonal date-palm Nolen Gur sweets"
  },

  // ==================== BENGALURU ====================
  {
    id: "blr-vidyarthi-bhavan",
    name: "Vidyarthi Bhavan",
    destinationId: "bengaluru",
    city: "Basavanagudi, Bengaluru",
    category: "Breakfast",
    specialties: ["Crisp Benne Masala Dosa", "Rava Vada", "Kesari Bath", "Filter Coffee"],
    description: "Historic 1943 cultural landmark in old Bangalore where servers balance towering stacks of thick, golden, butter-crisp dosas.",
    address: "32, Gandhi Bazaar Main Road, Basavanagudi, Bengaluru 560004",
    coords: { lat: 12.9435, lng: 77.5735 },
    priceRange: "₹",
    famousFor: "Legendary thick and crispy ghee masala dosa served with potato sagu"
  },
  {
    id: "blr-mtr",
    name: "Mavalli Tiffin Room (MTR)",
    destinationId: "bengaluru",
    city: "Lalbagh Road, Bengaluru",
    category: "Lunch",
    specialties: ["Traditional Karnataka Thali", "Rava Idli", "Chandrahara", "Bisi Bele Bath"],
    description: "Historic 1924 vegetarian institution beside Lalbagh gardens that invented the Rava Idli during World War II rice shortages.",
    address: "14, Lal Bagh Main Road, Doddamavalli, Bengaluru 560027",
    coords: { lat: 12.9555, lng: 77.5855 },
    priceRange: "₹₹",
    famousFor: "The birthplace of Rava Idli and authentic royal multi-course silver thalis"
  },

  // ==================== AGRA ====================
  {
    id: "agr-pinch-of-spice",
    name: "Pinch of Spice",
    destinationId: "agra",
    city: "Fatehabad Road, Agra",
    category: "Dinner",
    specialties: ["Murg Boti Masala", "Dal Makhani", "Paneer Tikka Lababdar", "Garlic Naan"],
    description: "Agra's premier dining establishment serving rich Mughlai and North Indian curries praised by domestic and international travellers.",
    address: "1076/2, Fatehabad Road, Tajganj, Agra 282001",
    coords: { lat: 27.1610, lng: 78.0410 },
    priceRange: "₹₹₹",
    famousFor: "Exquisite Mughlai charcoal gravies and rich Dal Makhani"
  },
  {
    id: "agr-deviram",
    name: "Deviram Sweets & Restaurant",
    destinationId: "agra",
    city: "Pratap Pura, Agra",
    category: "Breakfast",
    specialties: ["Agra Bedai & Aloo Sabzi", "Desi Ghee Jalebi", "Kachori", "Gulab Jamun"],
    description: "Centuries-old breakfast ritual in Agra serving crisp urad-dal stuffed puris (bedai) topped with hot spiced potato curry.",
    address: "Pratap Pura Crossing, Rakabganj, Agra 282001",
    coords: { lat: 27.1715, lng: 78.0125 },
    priceRange: "₹",
    famousFor: "Authentic Agra Bedai-Aloo morning feast and giant jalebis"
  },

  // ==================== MANALI ====================
  {
    id: "mnl-cafe-1947",
    name: "Café 1947",
    destinationId: "manali",
    city: "Old Manali",
    category: "Lunch",
    specialties: ["Wood-fired Pizza", "Pan-seared Himalayan Trout", "Risotto", "Mountain Herbal Teas"],
    description: "Scenic stone and wood riverside bistro situated directly on the rushing waters of Manalsu River in Old Manali.",
    address: "Old Manali Village, Near Bridge, Manali, Himachal Pradesh 175131",
    coords: { lat: 32.2545, lng: 77.1795 },
    priceRange: "₹₹",
    famousFor: "Fresh Himalayan rainbow trout and riverside outdoor deck dining"
  },
  {
    id: "mnl-johnsons",
    name: "The Johnson's Café & Bar",
    destinationId: "manali",
    city: "Circuit House Road, Manali",
    category: "Dinner",
    specialties: ["Baked Trout with Almonds", "Roast Lamb", "Apple Crumble", "Irish Coffee"],
    description: "Classic alpine wood cabin surrounded by apple orchards, recognized across Himachal for its delicate rainbow trout preparations.",
    address: "Circuit House Road, Siyal, Manali, Himachal Pradesh 175131",
    coords: { lat: 28.2465, lng: 77.1865 },
    priceRange: "₹₹₹",
    famousFor: "Wood-fired baked Himalayan river trout and warm apple pie"
  },

  // ==================== VISAKHAPATNAM ====================
  {
    id: "vsp-dharani",
    name: "Dharani Restaurant (Hotel Daspalla)",
    destinationId: "visakhapatnam",
    city: "Jagadamba Junction, Visakhapatnam",
    category: "Lunch",
    specialties: ["Royal Andhra Thali", "Kandi Podi with Ghee", "Gongura Mutton/Pachadi", "Avakaya Rice"],
    description: "The gold standard for traditional Andhra vegetarian and non-vegetarian thalis served on clean plantain leaves.",
    address: "Hotel Daspalla, Suryabagh, Jagadamba Junction, Visakhapatnam 530002",
    coords: { lat: 17.7125, lng: 78.3015 },
    priceRange: "₹₹",
    famousFor: "Traditional multi-course Andhra thali with spicy gun powders and pickles"
  },
  {
    id: "vsp-raju-dhaba",
    name: "Sea Inn (Raju Gari Dhaba)",
    destinationId: "visakhapatnam",
    city: "Rushikonda, Visakhapatnam",
    category: "Dinner",
    specialties: ["Spicy Prawn Fry", "Crab Masala", "Chilli Fish", "Biryani Rice"],
    description: "Famous coastal shack near Rushikonda beach revered for tongue-tingling rustic Andhra coastal seafood curries.",
    address: "Beach Road, Near Rushikonda Beach, Visakhapatnam 530045",
    coords: { lat: 17.7850, lng: 78.3810 },
    priceRange: "₹₹",
    famousFor: "Spicy Bay of Bengal prawns and clay-pot country style fish curry"
  },

  // ==================== RISHIKESH ====================
  {
    id: "rsh-chotiwala",
    name: "Chotiwala Restaurant",
    destinationId: "rishikesh",
    city: "Swarg Ashram, Rishikesh",
    category: "Lunch",
    specialties: ["Garhwali Thali", "Aloo Poori", "Chole Bhature", "Lassi"],
    description: "Legendary 1958 vegetarian heritage restaurant situated directly across the Ram Jhula suspension bridge on the sacred Ganga.",
    address: "Swarg Ashram, Ram Jhula, Rishikesh, Uttarakhand 249304",
    coords: { lat: 30.1225, lng: 78.3185 },
    priceRange: "₹",
    famousFor: "Historic pilgrim thalis and riverside North Indian vegetarian meals"
  },
  {
    id: "rsh-beatles-cafe",
    name: "Café de Delmar (The Beatles Café)",
    destinationId: "rishikesh",
    city: "Tapovan, Rishikesh",
    category: "Café & Bakery",
    specialties: ["Vegan Pancakes", "Organic Salads", "Smoothie Bowls", "Matcha Latte"],
    description: "Clifftop retro café overlooking the turquoise Ganga with 60s rock memorabilia and healthy organic world food.",
    address: "Paidal Marg, Tapovan Sarai, Badrinath Road, Rishikesh 249192",
    coords: { lat: 30.1335, lng: 78.3245 },
    priceRange: "₹₹",
    famousFor: "Panoramic river views, vegan smoothies, and retro music vibes"
  },

  // ==================== SRINAGAR ====================
  {
    id: "sxr-ahdoos",
    name: "Ahdoos Restaurant & Bakery",
    destinationId: "srinagar",
    city: "Residency Road, Srinagar",
    category: "Lunch",
    specialties: ["Traditional Kashmiri Wazwan", "Rista", "Gustaba", "Roganjosh", "Kahwa"],
    description: "Established in 1918 beside the Jhelum river, the undisputed home of traditional multi-course Kashmiri royal Wazwan.",
    address: "Residency Road, Regal Chowk, Srinagar, Jammu and Kashmir 190001",
    coords: { lat: 34.0725, lng: 74.8145 },
    priceRange: "₹₹₹",
    famousFor: "The definitive authentic 36-course Kashmiri royal Wazwan"
  },

  // ==================== LEH (LADAKH) ====================
  {
    id: "leh-tibetan-kitchen",
    name: "The Tibetan Kitchen",
    destinationId: "leh",
    city: "Fort Road, Leh",
    category: "Dinner",
    specialties: ["Gyako (Hot Pot)", "Tingmo with Shabalay", "Thukpa", "Butter Tea"],
    description: "Cosy stone-and-timber dining room in Leh town celebrated for hearty communal Himalayan hot pots and Tibetan dumplings.",
    address: "Fort Road, Near Hotel Yak Tail, Leh, Ladakh 194101",
    coords: { lat: 34.1635, lng: 77.5835 },
    priceRange: "₹₹",
    famousFor: "Communal simmering Gyako hot pot and steamed meat momos"
  },

  // ==================== PUDUCHERRY ====================
  {
    id: "pdy-cafe-des-arts",
    name: "Café des Arts",
    destinationId: "puducherry",
    city: "White Town, Puducherry",
    category: "Café & Bakery",
    specialties: ["Savory Buckwheat Galettes", "Nutella Crepes", "Gazpacho", "French Press Coffee"],
    description: "Bohemian 19th-century colonial yellow villa with vintage rickshaw, courtyard library, and authentic French Brittany crepes.",
    address: "10, Suffren Street, White Town, Puducherry 605001",
    coords: { lat: 11.9325, lng: 79.8335 },
    priceRange: "₹₹",
    famousFor: "Authentic French Brittany savoury galettes and courtyard garden ambience"
  },
];

export function getFoodPlacesForDestination(destId: string): FoodPlace[] {
  const norm = destId.toLowerCase().replace(/[\s_]+/g, "-");
  return foodPlaces.filter(f => f.destinationId === norm || f.destinationId === destId.toLowerCase());
}
