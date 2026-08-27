/**
 * Idempotent category-wise seed: 10 posts per category (80 total).
 * Run: npx tsx src/scripts/seed-categories.ts
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error", "warn"] });

const POSTERS: Record<string, string> = {
  mithila: "/1fc37d44-14b3-4706-8880-2e646f2805f7.jpg",
  warli: "/ad6f6831-5487-4038-9c1d-784f340b9d3d.jpg",
  baul: "/9c0ee134-0e5c-4d01-b23c-c42aaa2f7934.jpg",
  kalbelia: "/5cc59d29-a3b2-4ca6-8420-ecc86f309fec.jpg",
  theyyam: "/521aba80-aa8c-4b27-8ad3-50b1254f54f0.jpg",
  pattachitra: "/c1801f07-2b41-4c65-8bff-e69f3c081609.jpg",
  pottery: "/d6240f8c-0e49-4534-8f8c-4a7b61f2ba71.jpg",
  festival: "/6f8a9fc1-7733-4e4b-a51b-dd86f783400b.jpg",
  elder: "/b3ff0c82-6a38-4489-bc6e-4bb5386e212a.jpg",
  textile: "/a1d2e498-ff1f-4fcb-9e10-40b309b350e0.jpg",
};

// [title, desc, content, lat, lng, userEmail, region, tags[], posterKey, category]
type PostRow = {
  title: string; desc: string; content: string;
  lat: number; lng: number; userEmail: string; region: string;
  tags: string[]; posterKey: string; category: string;
};

const POSTS: PostRow[] = [
  // ── folk-song (10)
  { title: "Sohar — the birth song of Mithila", desc: "Sung by women on the sixth night after birth.", content: "Maithili birth song with lamp imagery.", lat: 26.13, lng: 85.9, userEmail: "kamla@example.com", region: "Mithila, Bihar", tags: ["sohar", "birth-song", "maithili"], posterKey: "mithila", category: "folk-song" },
  { title: "Sohar as sung in Saharsa — the Kosi variant", desc: "Same song, different melody across the Kosi.", content: "Kosi-region variant with drum.", lat: 25.88, lng: 86.6, userEmail: "kamla@example.com", region: "Mithila, Bihar", tags: ["sohar", "kosi", "variant"], posterKey: "mithila", category: "folk-song" },
  { title: "Baul song at Tarakpur akhara", desc: "Improvised monsoon verse.", content: "Syncretic Baul tradition of Bengal.", lat: 23.87, lng: 87.62, userEmail: "anwesha@example.com", region: "Birbhum, West Bengal", tags: ["baul", "bengal", "monsoon"], posterKey: "baul", category: "folk-song" },
  { title: "Bhatiali — the boatman's river song", desc: "Songs sung while fishing on the Padma.", content: "Bengali river folk tradition.", lat: 23.5, lng: 88.5, userEmail: "anwesha@example.com", region: "Birbhum, West Bengal", tags: ["bhatiali", "river", "bengal"], posterKey: "baul", category: "folk-song" },
  { title: "Lavani beats of Marathwada", desc: "Rhythmic folk songs with dholki.", content: "Maharashtra's powerful women's song tradition.", lat: 19.0, lng: 75.5, userEmail: "jivya@example.com", region: "Palghar, Maharashtra", tags: ["lavani", "marathwada", "dholki"], posterKey: "warli", category: "folk-song" },
  { title: "Pawra — tribal harvest songs of Bastar", desc: "Sung during the rice harvest.", content: "Gondi-language harvest folk songs.", lat: 19.1, lng: 81.25, userEmail: "aarav@example.com", region: "Bastar, Chhattisgarh", tags: ["pawra", "harvest", "gondi"], posterKey: "elder", category: "folk-song" },
  { title: "Jhula songs of Chhattisgarh", desc: "Lullaby songs sung near the cradle.", content: "Women's lullaby tradition.", lat: 21.25, lng: 81.6, userEmail: "aarav@example.com", region: "Bastar, Chhattisgarh", tags: ["jhula", "lullaby", "cradle"], posterKey: "elder", category: "folk-song" },
  { title: "Rajasthani Maand — desert ballad", desc: "Long-form ballad of love and valour.", content: "Manganiyar musicians of Jaisalmer.", lat: 26.92, lng: 70.91, userEmail: "rukma@example.com", region: "Jaisalmer, Rajasthan", tags: ["maand", "desert", "manganiyar"], posterKey: "kalbelia", category: "folk-song" },
  { title: "Odiya Pala — narrative folk singing", desc: "Story-song performed with cymbals.", content: "Odisha's travelling bards.", lat: 20.0, lng: 85.5, userEmail: "sudarshan@example.com", region: "Puri, Odisha", tags: ["pala", "narrative", "odia"], posterKey: "pattachitra", category: "folk-song" },
  { title: "Bihu songs of Assam", desc: "Spring songs of the Ahom new year.", content: "Assamese harvest celebration songs.", lat: 26.95, lng: 94.62, userEmail: "anwesha@example.com", region: "Majuli, Assam", tags: ["bihu", "spring", "assamese"], posterKey: "baul", category: "folk-song" },

  // ── folk-story (10)
  { title: "Ghotul nights — the Muria storyteller", desc: "Creation myth at youth dormitory.", content: "Muria tribal storytelling tradition.", lat: 19.1, lng: 81.25, userEmail: "aarav@example.com", region: "Bastar, Chhattisgarh", tags: ["ghotul", "muria", "creation-myth"], posterKey: "elder", category: "folk-story" },
  { title: "Katha-vachak — the village storyteller of Mithila", desc: "Ramayana retelling at evening gathering.", content: "Maithili oral narrative tradition.", lat: 26.2, lng: 85.9, userEmail: "kamla@example.com", region: "Mithila, Bihar", tags: ["katha", "ramayana", "maithili"], posterKey: "mithila", category: "folk-story" },
  { title: "Birsa's tale — tribal resistance folklore", desc: "Stories of Birsa Munda's fight.", content: "Jharkhand's oral resistance narrative.", lat: 23.35, lng: 85.33, userEmail: "anwesha@example.com", region: "Birbhum, West Bengal", tags: ["birsa", "resistance", "tribal"], posterKey: "baul", category: "folk-story" },
  { title: "Thatheras of Jandiala Guru — metalwork fables", desc: "Stories told while beating brass.", content: "Punjab's craft storytellers.", lat: 31.5, lng: 75.2, userEmail: "aarav@example.com", region: "Bastar, Chhattisgarh", tags: ["thathera", "brass", "punjab"], posterKey: "pottery", category: "folk-story" },
  { title: "Yakshagana stories — coastal Karnataka tales", desc: "Mythological tales in dance-drama.", content: "Night-long folk theatre tradition.", lat: 12.8, lng: 74.8, userEmail: "balan@example.com", region: "Kannur, Kerala", tags: ["yakshagana", "karnataka", "mythology"], posterKey: "theyyam", category: "folk-story" },
  { title: "Rai dance stories of Jharkhand", desc: "Stories told through agile movements.", content: "Santal tribal dance narratives.", lat: 22.8, lng: 86.2, userEmail: "anwesha@example.com", region: "Birbhum, West Bengal", tags: ["rai", "santal", "jharkhand"], posterKey: "baul", category: "folk-story" },
  { title: "Bhopa ballads of Rajasthan", desc: "Pabuji ki Phad scroll narration.", content: "Living scroll painting storytellers.", lat: 25.5, lng: 73.5, userEmail: "rukma@example.com", region: "Jaisalmer, Rajasthan", tags: ["bhopa", "phad", "scroll"], posterKey: "kalbelia", category: "folk-story" },
  { title: "Kamakhya temple legends", desc: "Stories of the bleeding goddess.", content: "Assamese temple folklore.", lat: 26.17, lng: 91.71, userEmail: "anwesha@example.com", region: "Majuli, Assam", tags: ["kamakhya", "temple", "legend"], posterKey: "baul", category: "folk-story" },
  { title: "Bagheli folk tales of Central India", desc: "Folk tales of the Bagheli community.", content: "Central India's story heritage.", lat: 22.0, lng: 82.0, userEmail: "aarav@example.com", region: "Bastar, Chhattisgarh", tags: ["bagheli", "folk-tale", "central-india"], posterKey: "elder", category: "folk-story" },
  { title: "Warli creation stories", desc: "The God who drew the first Warli.", content: "Palghar tribal origin narrative.", lat: 19.7, lng: 72.85, userEmail: "jivya@example.com", region: "Palghar, Maharashtra", tags: ["warli", "creation", "origin"], posterKey: "warli", category: "folk-story" },

  // ── oral-tradition (10)
  { title: "Songs of the turning wheel — Khavda pottery", desc: "Work songs of women potters.", content: "Kutch pottery craft with songs.", lat: 23.73, lng: 68.51, userEmail: "meera@example.com", region: "Kutch, Gujarat", tags: ["pottery", "work-song", "kutch"], posterKey: "pottery", category: "oral-tradition" },
  { title: "Lok-katha of Bengal — the village story circle", desc: "Weekly storytelling at the panchayat.", content: "Bengal's community oral tradition.", lat: 23.0, lng: 87.5, userEmail: "anwesha@example.com", region: "Birbhum, West Bengal", tags: ["lok-katha", "panchayat", "bengal"], posterKey: "baul", category: "oral-tradition" },
  { title: "Pardhan oral epics of Madhya Pradesh", desc: "Gond bards recite hero songs.", content: "Generations of Pardhan genealogy singers.", lat: 22.5, lng: 78.5, userEmail: "aarav@example.com", region: "Bastar, Chhattisgarh", tags: ["pardhan", "gond", "epic"], posterKey: "elder", category: "oral-tradition" },
  { title: "Kolhati ballads of Maharashtra", desc: "Labour songs of the Kol community.", content: "Worker songs passed orally.", lat: 19.5, lng: 73.0, userEmail: "jivya@example.com", region: "Palghar, Maharashtra", tags: ["kolhati", "labour", "maharashtra"], posterKey: "warli", category: "oral-tradition" },
  { title: "Biraha of Bihar — spontaneous verse duel", desc: "Competitive folk poetry.", content: "Maithili oral poetry contests.", lat: 25.5, lng: 86.0, userEmail: "kamla@example.com", region: "Mithila, Bihar", tags: ["biraha", "poetry", "maithili"], posterKey: "mithila", category: "oral-tradition" },
  { title: "Dappan-koothu — Tamil martial oral tradition", desc: "Stories of Vali and Sugriva told in dance.", content: "Tamil folk performance tradition.", lat: 10.8, lng: 79.1, userEmail: "aarav@example.com", region: "Thanjavur, Tamil Nadu", tags: ["koothu", "tamil", "martial"], posterKey: "theyyam", category: "oral-tradition" },
  { title: "Folk medicine knowledge of the Soligas", desc: "Oral transmission of forest remedies.", content: "Karnataka tribal herbal lore.", lat: 12.5, lng: 76.0, userEmail: "balan@example.com", region: "Kannur, Kerala", tags: ["soliga", "medicine", "forest"], posterKey: "theyyam", category: "oral-tradition" },
  { title: "Lok-geet of Himachal — mountain work songs", desc: "Songs of terraced farming.", content: "Pahari oral harvest tradition.", lat: 31.5, lng: 77.5, userEmail: "anwesha@example.com", region: "Majuli, Assam", tags: ["lok-geet", "himachal", "farming"], posterKey: "baul", category: "oral-tradition" },
  { title: "Oraon harvest chants of Jharkhand", desc: "Songs invoking Dharti Aaba.", content: "Mundari oral agricultural tradition.", lat: 23.0, lng: 85.5, userEmail: "anwesha@example.com", region: "Birbhum, West Bengal", tags: ["oraon", "harvest", "mundari"], posterKey: "baul", category: "oral-tradition" },
  { title: "Kashmiri lullaby tradition", desc: "Soothing geet near the hearth.", content: "Kashmiri oral parenting tradition.", lat: 34.0, lng: 74.8, userEmail: "aarav@example.com", region: "Bastar, Chhattisgarh", tags: ["lullaby", "kashmiri", "hearth"], posterKey: "elder", category: "oral-tradition" },

  // ── artwork (10)
  { title: "Warli painting of the harvest cycle", desc: "Three-day painting on community hall wall.", content: "Warli tribal art with rice paste pigment.", lat: 19.69, lng: 72.82, userEmail: "jivya@example.com", region: "Palghar, Maharashtra", tags: ["warli", "harvest", "tribal-art"], posterKey: "warli", category: "artwork" },
  { title: "Pattachitra — painting the Ramayana scroll", desc: "12-foot scroll with natural pigments.", content: "Traditional Odisha scroll painting.", lat: 19.81, lng: 85.83, userEmail: "sudarshan@example.com", region: "Puri, Odisha", tags: ["pattachitra", "scroll", "natural-pigments"], posterKey: "pattachitra", category: "artwork" },
  { title: "Bhavai — the balancing act of Rajasthan", desc: "Seven brass pots and comic dialogue.", content: "Folk theatre with acrobatics.", lat: 27.56, lng: 76.63, userEmail: "rukma@example.com", region: "Alwar, Rajasthan", tags: ["bhavai", "folk-theatre", "acrobatics"], posterKey: "kalbelia", category: "artwork" },
  { title: "Mithila painting — the Madhubani fish motif", desc: "Fish symbolising fertility and good luck.", content: "Bihar's women's wall painting tradition.", lat: 26.15, lng: 85.95, userEmail: "kamla@example.com", region: "Mithila, Bihar", tags: ["mithila", "madhubani", "fish"], posterKey: "mithila", category: "artwork" },
  { title: "Cheriyal scroll painting of Telangana", desc: "Narrative scrolls of Nakashi artists.", content: "Telangana's painted scroll tradition.", lat: 18.0, lng: 78.5, userEmail: "sudarshan@example.com", region: "Puri, Odisha", tags: ["cheriyal", "scroll", "telangana"], posterKey: "pattachitra", category: "artwork" },
  { title: "Tanjore painting — gold leaf art of Tamil Nadu", desc: "Gems and gold on wooden panel.", content: "South India's classical panel art.", lat: 10.8, lng: 79.15, userEmail: "aarav@example.com", region: "Thanjavur, Tamil Nadu", tags: ["tanjore", "gold-leaf", "tamil"], posterKey: "pottery", category: "artwork" },
  { title: "Gond art of Jangarh Singh Shyam", desc: "Dots and lines that tell forest stories.", content: "Pradhans of Madhya Pradesh.", lat: 22.5, lng: 78.5, userEmail: "aarav@example.com", region: "Bastar, Chhattisgarh", tags: ["gond", "forest", "jangarh"], posterKey: "elder", category: "artwork" },
  { title: "Phad painting — Rajasthan's mobile temple", desc: "Narrative cloth scrolls of Bhil community.", content: "Devnarayan's tale on fabric.", lat: 25.5, lng: 73.5, userEmail: "rukma@example.com", region: "Jaisalmer, Rajasthan", tags: ["phad", "bhil", "devnarayan"], posterKey: "kalbelia", category: "artwork" },
  { title: "Lippan art — Kutch mud mirror work", desc: "Geometric patterns with cow dung and mirrors.", content: "Gujarat's women's wall craft.", lat: 23.5, lng: 68.5, userEmail: "meera@example.com", region: "Kutch, Gujarat", tags: ["lippan", "mirror", "kutch"], posterKey: "textile", category: "artwork" },
  { title: "Sohrai painting of Jharkhand", desc: "Harvest season wall art by Santal women.", content: "Jharkhand's ancient village painting.", lat: 23.5, lng: 86.0, userEmail: "anwesha@example.com", region: "Birbhum, West Bengal", tags: ["sohrai", "santal", "harvest"], posterKey: "baul", category: "artwork" },

  // ── craft (10)
  { title: "Making a Chhau dance mask", desc: "Papier-mache mask shaping.", content: "Jhargram Chhau mask artisans.", lat: 22.45, lng: 86.95, userEmail: "aarav@example.com", region: "Jhargram, West Bengal", tags: ["chhau", "mask", "papier-mache"], posterKey: "pattachitra", category: "craft" },
  { title: "Rogan painting — castor oil art of Kutch", desc: "Castor oil paste on fabric.", content: "Single-family art from Nirona village.", lat: 23.45, lng: 69.52, userEmail: "meera@example.com", region: "Kutch, Gujarat", tags: ["rogan-art", "castor-oil", "nirona"], posterKey: "textile", category: "craft" },
  { title: "Dhokra lost-wax casting of Bastar", desc: "Brass figurines by tribal artisans.", content: "4000-year-old metalcraft tradition.", lat: 19.1, lng: 81.3, userEmail: "aarav@example.com", region: "Bastar, Chhattisgarh", tags: ["dhokra", "lost-wax", "brass"], posterKey: "pottery", category: "craft" },
  { title: "Banarasi silk weaving — the jacquard loom", desc: "Silk brocade with real zari.", content: "Varanasi's centuries-old textile art.", lat: 25.3, lng: 83.0, userEmail: "kamla@example.com", region: "Mithila, Bihar", tags: ["banarasi", "silk", "jacquard"], posterKey: "textile", category: "craft" },
  { title: "Kondapalli toy making of Andhra", desc: "Soft wood toys painted in bright colours.", content: "Village craft passed down generations.", lat: 16.0, lng: 80.0, userEmail: "sudarshan@example.com", region: "Puri, Odisha", tags: ["kondapalli", "toy", "andhra"], posterKey: "pattachitra", category: "craft" },
  { title: "Channapatna lacquered toys of Karnataka", desc: "Colourful wooden toys with natural dyes.", content: "Bangalore-Mysore highway craft.", lat: 12.6, lng: 77.2, userEmail: "balan@example.com", region: "Kannur, Kerala", tags: ["channapatna", "lacquer", "karnataka"], posterKey: "theyyam", category: "craft" },
  { title: "Bamboo craft of Meghalaya", desc: "Fishing traps and household baskets.", content: "Khasi Hills bamboo tradition.", lat: 25.5, lng: 91.9, userEmail: "anwesha@example.com", region: "Majuli, Assam", tags: ["bamboo", "meghalaya", "basket"], posterKey: "baul", category: "craft" },
  { title: "Blue pottery of Jaipur", desc: "Persian technique adapted in Rajasthan.", content: "Distinctive blue-glazed tiles and pots.", lat: 26.9, lng: 75.8, userEmail: "rukma@example.com", region: "Jaisalmer, Rajasthan", tags: ["blue-pottery", "jaipur", "tiles"], posterKey: "kalbelia", category: "craft" },
  { title: "Tholu Bommalata — leather puppet craft", desc: "Tanned leather puppets for shadow play.", content: "Andhra Pradesh's puppet art.", lat: 15.5, lng: 78.5, userEmail: "sudarshan@example.com", region: "Puri, Odisha", tags: ["leather", "puppet", "andhra"], posterKey: "pattachitra", category: "craft" },
  { title: "Palm leaf manuscript craft of Odisha", desc: "Etching on dried palm leaves.", content: "Traditional bahi binding art.", lat: 20.0, lng: 85.8, userEmail: "sudarshan@example.com", region: "Puri, Odisha", tags: ["palm-leaf", "manuscript", "odisha"], posterKey: "pattachitra", category: "craft" },

  // ── festival (10)
  { title: "Chhath at the ghat — the evening arghya", desc: "Offering to the setting sun.", content: "Sun worship at Kamla river.", lat: 26.35, lng: 86.07, userEmail: "kamla@example.com", region: "Mithila, Bihar", tags: ["chhath", "sun-worship", "ghat"], posterKey: "festival", category: "festival" },
  { title: "Theyyam at Chembilode kavu", desc: "Kari Kuttiyyattam Theyyam performance.", content: "Ritual art of North Kerala.", lat: 11.87, lng: 75.37, userEmail: "balan@example.com", region: "Kannur, Kerala", tags: ["theyyam", "kavu", "ritual"], posterKey: "theyyam", category: "festival" },
  { title: "Poush Mela — Birbhum's winter fair", desc: "Three-day Baul music and cattle fair.", content: "West Bengal's folk music gathering.", lat: 23.88, lng: 87.63, userEmail: "anwesha@example.com", region: "Birbhum, West Bengal", tags: ["poush-mela", "fair", "baul"], posterKey: "baul", category: "festival" },
  { title: "Navratri garba of Gujarat", desc: "Nine nights of circular dance.", content: "Ahmedabad's massive community garba.", lat: 23.0, lng: 72.6, userEmail: "meera@example.com", region: "Kutch, Gujarat", tags: ["navratri", "garba", "gujarat"], posterKey: "festival", category: "festival" },
  { title: "Bihu dance of Assam", desc: "Traditional spring dance with dhol and pepa.", content: "Assamese new year celebration.", lat: 26.95, lng: 94.62, userEmail: "anwesha@example.com", region: "Majuli, Assam", tags: ["bihu", "dance", "spring"], posterKey: "baul", category: "festival" },
  { title: "Hornbill festival of Nagaland", desc: "Festival of festivals — tribal showcase.", content: "Kohima's annual cultural gathering.", lat: 25.6, lng: 94.1, userEmail: "anwesha@example.com", region: "Majuli, Assam", tags: ["hornbill", "nagaland", "tribal"], posterKey: "baul", category: "festival" },
  { title: "Pushkar camel fair of Rajasthan", desc: "Livestock trading meets folk culture.", content: "Pushkar's desert carnival.", lat: 26.5, lng: 74.5, userEmail: "rukma@example.com", region: "Jaisalmer, Rajasthan", tags: ["pushkar", "camel", "fair"], posterKey: "kalbelia", category: "festival" },
  { title: "Teej — monsoon festival of Rajasthan", desc: "Women's swing festival for marital bliss.", content: "Jaipur's green-clad celebration.", lat: 26.9, lng: 75.8, userEmail: "rukma@example.com", region: "Jaisalmer, Rajasthan", tags: ["teej", "monsoon", "swing"], posterKey: "kalbelia", category: "festival" },
  { title: "Rath Yatra — Puri's chariot festival", desc: "Jagannath's annual journey to Gundicha.", content: "World's largest open-air procession.", lat: 19.8, lng: 85.8, userEmail: "sudarshan@example.com", region: "Puri, Odisha", tags: ["rath-yatra", "jagannath", "chariot"], posterKey: "pattachitra", category: "festival" },
  { title: "Onam — Kerala's harvest festival", desc: "Ten days of flowers, feasts and dance.", content: "Mahabali's mythical homecoming.", lat: 9.9, lng: 76.3, userEmail: "balan@example.com", region: "Kannur, Kerala", tags: ["onam", "harvest", "kerala"], posterKey: "theyyam", category: "festival" },

  // ── local-history (10)
  { title: "The forgotten salt routes of Kutch", desc: "Trading paths that shaped the region.", content: "Oral history of Khavda salt merchants.", lat: 23.8, lng: 68.3, userEmail: "meera@example.com", region: "Kutch, Gujarat", tags: ["salt-route", "kutch", "trade"], posterKey: "pottery", category: "local-history" },
  { title: "Mithila's flood memory songs", desc: "Songs recalling the 1988 and 2017 floods.", content: "Oral records of climate events.", lat: 26.1, lng: 86.0, userEmail: "kamla@example.com", region: "Mithila, Bihar", tags: ["flood", "climate", "memory"], posterKey: "mithila", category: "local-history" },
  { title: "Bastar's tribal migration stories", desc: "How the Maria Gonds came to Bastar.", content: "Origin tales of Chhattisgarh's tribes.", lat: 19.1, lng: 81.25, userEmail: "aarav@example.com", region: "Bastar, Chhattisgarh", tags: ["migration", "maria", "gond"], posterKey: "elder", category: "local-history" },
  { title: "The Kolam revolt — Bhil tribal resistance", desc: "Oral account of the 1940s uprising.", content: "Rajasthan's tribal freedom story.", lat: 24.5, lng: 74.0, userEmail: "rukma@example.com", region: "Alwar, Rajasthan", tags: ["kolam", "bhil", "revolt"], posterKey: "kalbelia", category: "local-history" },
  { title: "Warli's 1945 strike — the Adivasi struggle", desc: "Land rights movement told through paintings.", content: "Palghar's modern tribal history.", lat: 19.7, lng: 72.8, userEmail: "jivya@example.com", region: "Palghar, Maharashtra", tags: ["warli-strike", "land-rights", "adivasi"], posterKey: "warli", category: "local-history" },
  { title: "Majuli's eroding island stories", desc: "How the Brahmaputra is swallowing the island.", content: "Assam's disappearing cultural landscape.", lat: 26.95, lng: 94.6, userEmail: "anwesha@example.com", region: "Majuli, Assam", tags: ["erosion", "majuli", "brahmaputra"], posterKey: "baul", category: "local-history" },
  { title: "Mughal-era water channels of Jaipur", desc: "Stories of stepwells and baoris.", content: "Rajasthan's water heritage.", lat: 26.9, lng: 75.8, userEmail: "rukma@example.com", region: "Jaisalmer, Rajasthan", tags: ["water", "stepwell", "mughal"], posterKey: "kalbelia", category: "local-history" },
  { title: "Puri's temple town memories", desc: "Oral history of the jagannath servitor families.", content: "Generations of temple service.", lat: 19.8, lng: 85.83, userEmail: "sudarshan@example.com", region: "Puri, Odisha", tags: ["temple", "servitor", "jagannath"], posterKey: "pattachitra", category: "local-history" },
  { title: "The coolie bazaar of Kolar — migration tales", desc: "Gold mine workers' journey stories.", content: "Karnataka's industrial oral history.", lat: 13.1, lng: 78.1, userEmail: "balan@example.com", region: "Kannur, Kerala", tags: ["kolar", "migration", "gold-mine"], posterKey: "theyyam", category: "local-history" },
  { title: "Sohrai songs as harvest calendar", desc: "Songs that mark the farming seasons.", content: "Jharkhand's oral agricultural almanac.", lat: 23.5, lng: 86.0, userEmail: "anwesha@example.com", region: "Birbhum, West Bengal", tags: ["sohrai", "calendar", "farming"], posterKey: "baul", category: "local-history" },

  // ── traditional-practice (10)
  { title: "Kalbelia dance — the serpent spiral", desc: "Spiralling movements at village fair.", content: "UNESCO Kalbelia dance from Rajasthan.", lat: 25.75, lng: 71.39, userEmail: "rukma@example.com", region: "Jaisalmer, Rajasthan", tags: ["kalbelia", "serpent", "unesco"], posterKey: "kalbelia", category: "traditional-practice" },
  { title: "Sattriya — dance of Assam's monasteries", desc: "Nritta and Abhinaya at Kamalabari Satra.", content: "Classical dance from Vaishnavite tradition.", lat: 26.95, lng: 94.62, userEmail: "anwesha@example.com", region: "Majuli, Assam", tags: ["sattriya", "monastery", "classical"], posterKey: "baul", category: "traditional-practice" },
  { title: "Temple dance — Thanjavur Bhagavata Mela", desc: "Behind-the-scenes of dance-drama prep.", content: "Traditional Bharatanatyam theatre.", lat: 10.79, lng: 79.13, userEmail: "aarav@example.com", region: "Thanjavur, Tamil Nadu", tags: ["bhagavata-mela", "bharatanatyam", "thanjavur"], posterKey: "theyyam", category: "traditional-practice" },
  { title: "Sora ritual dance of Odisha's Juang tribe", desc: "Harvest dance invoking earth spirits.", content: "Odisha's lesser-known tribal practice.", lat: 20.5, lng: 85.5, userEmail: "sudarshan@example.com", region: "Puri, Odisha", tags: ["sora", "juang", "harvest"], posterKey: "pattachitra", category: "traditional-practice" },
  { title: "Bihu dance of Assam — the bailoch", desc: "Youth dance with jaapi and pepa.", content: "Assamese spring ritual.", lat: 26.95, lng: 94.62, userEmail: "anwesha@example.com", region: "Majuli, Assam", tags: ["bihu", "bailoch", "assam"], posterKey: "baul", category: "traditional-practice" },
  { title: "Chhau dance — martial art in mask", desc: "Seraikella's masked warrior dance.", content: "Jharkhand's semi-classical tradition.", lat: 22.7, lng: 85.8, userEmail: "anwesha@example.com", region: "Birbhum, West Bengal", tags: ["chhau", "martial", "masked"], posterKey: "baul", category: "traditional-practice" },
  { title: "Theyyam possession ritual — when the god arrives", desc: "The moment of divine entry.", content: "Kerala's most intense ritual moment.", lat: 11.88, lng: 75.38, userEmail: "balan@example.com", region: "Kannur, Kerala", tags: ["theyyam", "possession", "divine"], posterKey: "theyyam", category: "traditional-practice" },
  { title: "Tusu Parab — the harvest farewell", desc: "Building and drowning Tusu images.", content: "Bengal's women's harvest festival.", lat: 23.5, lng: 87.5, userEmail: "anwesha@example.com", region: "Birbhum, West Bengal", tags: ["tusu", "harvest", "women"], posterKey: "baul", category: "traditional-practice" },
  { title: "Bhagoria — the festival of love", desc: "Tribal courtship festival of Madhya Pradesh.", content: "Malwa's vibrant spring celebration.", lat: 22.5, lng: 76.5, userEmail: "aarav@example.com", region: "Bastar, Chhattisgarh", tags: ["bhagoria", "courtship", "malwa"], posterKey: "elder", category: "traditional-practice" },
  { title: "Thaipusam — the kavadi bearers of Tamil Nadu", desc: "Piercing and carrying offerings.", content: "Tamil devotional endurance ritual.", lat: 10.8, lng: 79.15, userEmail: "aarav@example.com", region: "Thanjavur, Tamil Nadu", tags: ["thaipusam", "kavadi", "devotional"], posterKey: "theyyam", category: "traditional-practice" },
];

async function main() {
  console.log("Seeding 10 posts per category (80 total)...\n");

  const dbUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const userByEmail = Object.fromEntries(dbUsers.map((u) => [u.email, u.id]));

  const dbCats = await prisma.culturalCategory.findMany({ select: { id: true, name: true } });
  const catByName = Object.fromEntries(dbCats.map((c) => [c.name, c.id]));

  const dbRegions = await prisma.region.findMany({ select: { id: true, name: true } });
  const regByName = Object.fromEntries(dbRegions.map((r) => [r.name, r.id]));

  const dbTags = await prisma.tag.findMany({ select: { id: true, name: true } });
  const tagByName = Object.fromEntries(dbTags.map((t) => [t.name, t.id]));

  const publicDir = path.resolve(__dirname, "../../../frontend/public");

  // Find existing titles to skip
  const existingTitles = new Set(
    (await prisma.culturalPost.findMany({ select: { title: true } })).map((p) => p.title)
  );
  console.log(`  ${existingTitles.size} existing posts in DB`);

  const newPosts = POSTS.filter((p) => !existingTitles.has(p.title));
  console.log(`  ${newPosts.length} new posts to create`);

  // Batch create posts
  let created = 0;
  for (const p of newPosts) {
    const userId = userByEmail[p.userEmail];
    if (!userId) continue;

    const post = await prisma.culturalPost.create({
      data: {
        title: p.title,
        description: p.desc,
        content: p.content,
        latitude: p.lat,
        longitude: p.lng,
        published: true,
        userId,
        regionId: regByName[p.region],
        categoryId: catByName[p.category],
      },
    });

    // Tags
    const tagData = p.tags
      .filter((t) => tagByName[t])
      .map((t) => ({ postId: post.id, tagId: tagByName[t] }));
    if (tagData.length > 0) {
      await prisma.tagOnPost.createMany({ data: tagData, skipDuplicates: true });
    }

    // Media
    const posterUrl = (POSTERS[p.posterKey] || POSTERS.mithila) as string;
    const posterAbs = path.join(publicDir, posterUrl.replace(/^\//, ""));
    await prisma.media.create({
      data: {
        url: posterUrl,
        type: "image",
        mimeType: "image/jpeg",
        size: fs.existsSync(posterAbs) ? fs.statSync(posterAbs).size : 0,
        filename: path.basename(posterUrl),
        postId: post.id,
      },
    });

    created++;
    if (created % 10 === 0) console.log(`  ...${created} created`);
  }

  console.log(`\nDone: ${created} new posts created.`);

  // Print category counts
  const counts = await prisma.culturalPost.groupBy({
    by: ["categoryId"],
    _count: { id: true },
    where: { published: true },
  });
  const catMap: Record<string, string> = {};
  for (const c of dbCats) catMap[c.id] = c.name;
  console.log("\nCategory post counts:");
  for (const c of counts) {
    const name = c.categoryId ? catMap[c.categoryId] : "uncategorized";
    console.log(`  ${name}: ${c._count.id}`);
  }

  const total = counts.reduce((s, c) => s + c._count.id, 0);
  console.log(`\nTotal published posts: ${total}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
