import type { CulturalRecord } from '../types/culture';
import type { AIEnrichment } from '../types/ai';
import type { CommunityLayer, VerificationStatus } from '../types/verification';

const IMG = {
  mithila: "/1fc37d44-14b3-4706-8880-2e646f2805f7.jpg",
  warli: "/ad6f6831-5487-4038-9c1d-784f340b9d3d.jpg",
  baul: "/9c0ee134-0e5c-4d01-b23c-c42aaa2f7934.jpg",
  kalbelia: "/5cc59d29-a3b2-4ca6-8420-ecc86f309fec.jpg",
  theyyam: "/521aba80-aa8c-4b27-8ad3-50b1254f54f0.jpg",
  pattachitra: "/c1801f07-2b41-4c65-8bff-e69f3c081609.jpg",
  pottery: "/d6240f8c-0e49-4534-8f8c-4a7b61f2ba71.jpg",
  festival: "/6f8a9fc1-7733-4e4b-a51b-dd86f783400b.jpg",
  elder: "/b3ff0c82-6a38-4489-bc6e-4bb5386e212a.jpg"
} as const;

export const CULTURAL_IMAGES = IMG;

function community(
status: VerificationStatus,
verifiedBy: number,
extra: Partial<CommunityLayer> = {})
: CommunityLayer {
  return { status, verifiedBy, notes: [], corrections: [], history: [], ...extra };
}

function enrich(partial: Partial<AIEnrichment> & {tags: string[];}): AIEnrichment {
  return { status: 'COMPLETED', completedAt: '2026-06-02T09:12:00Z', ...partial };
}

export const records: CulturalRecord[] = [
{
  id: 'r1',
  title: 'Sohar — the birth song of Mithila',
  description:
  'Sung by the women of the household on the sixth night after a child is born. The verses name the newborn’s relatives one by one and ask each to bless the child.',
  category: 'folk-song',
  region: 'Mithila, Bihar',
  state: 'Bihar',
  coordinates: [26.13, 85.9],
  tradition: 'Sohar',
  artForm: 'Mithila painting',
  festival: 'Chhath',
  creatorId: 'u1',
  createdAt: '2026-05-28T16:40:00Z',
  tags: ['birth ritual', 'women’s song', 'maithili', 'mithila'],
  likes: 412,
  comments: 38,
  saves: 190,
  featured: true,
  source: {
    media: { type: 'audio', posterUrl: IMG.mithila, durationSec: 214, altText: 'Mithila painting on handmade paper accompanying the recording' },
    language: 'Maithili',
    transcript:
    'ललना रे, आजु भेल अङ्गना उजोर,\nसासु मोरा गावथि सोहर रे ललना।\nननदि आबथि हाथ में दीप लेने,\nबाबा के अङ्गना भेल इजोत रे ललना।',
    contributorNote:
    'Recorded in my courtyard in Madhubani district after my grandson’s chhathi. The other women are singing the response line.',
    recordedAt: '2026-05-27T19:05:00Z',
    recordedBy: 'Kamla Devi'
  },
  ai: enrich({
    detectedLanguage: 'Maithili',
    translation:
    'O little one, today the courtyard has grown bright —\nmy mother-in-law is singing the sohar.\nThe sister-in-law comes carrying a lamp in her hands,\nthe father’s courtyard is filled with light, O little one.',
    summary:
    'A Maithili birth song (sohar) performed on the sixth night after childbirth. Lamp imagery marks the courtyard as ritually bright; the verses invoke each female relative in sequence.',
    tags: ['Mithila', 'Maithili', 'birth ritual', 'chhathi', 'women’s repertoire', 'lamp imagery']
  }),
  community: community('verified', 6, {
    notes: [
    {
      id: 'n1',
      userId: 'u3',
      body: 'In Saharsa the same tune carries a different second line — the lamp is carried by the husband’s sister only if she is unmarried.',
      createdAt: '2026-05-30T08:20:00Z'
    }],

    corrections: [
    {
      id: 'c1',
      userId: 'u3',
      field: 'Translation',
      suggestion: '“इजोत” is closer to “radiance” than “light” in this ritual context.',
      createdAt: '2026-05-29T11:00:00Z',
      accepted: true
    }],

    history: [
    { id: 'h1', action: 'verify', userId: 'u3', note: 'Matches the Madhubani sohar I recorded in 2019.', createdAt: '2026-05-29T09:00:00Z' },
    { id: 'h2', action: 'correct', userId: 'u3', note: 'Translation nuance on “इजोत”.', createdAt: '2026-05-29T11:00:00Z' },
    { id: 'h3', action: 'context', userId: 'u1', note: 'Added note on regional variation.', createdAt: '2026-05-30T08:20:00Z' }]

  }),
  relationships: [
  { type: 'REGIONAL_VARIANT', recordId: 'r2' },
  { type: 'SAME_FESTIVAL', recordId: 'r3' },
  { type: 'SAME_ART_FORM', recordId: 'r4' },
  { type: 'RELATED_SONG', recordId: 'r11' }]

},
{
  id: 'r2',
  title: 'Sohar as sung in Saharsa — the Kosi variant',
  description:
  'The same birth song, carried across the Kosi river. The melody drops a note at the end of each line and the lamp verse is omitted entirely.',
  category: 'folk-song',
  region: 'Mithila, Bihar',
  state: 'Bihar',
  coordinates: [25.88, 86.6],
  tradition: 'Sohar',
  festival: 'Chhath',
  creatorId: 'u3',
  createdAt: '2026-05-20T10:15:00Z',
  tags: ['birth ritual', 'kosi', 'variant'],
  likes: 176,
  comments: 14,
  saves: 61,
  source: {
    media: { type: 'audio', posterUrl: IMG.elder, durationSec: 168, altText: 'Elder singer seated on a charpai during the recording' },
    language: 'Maithili',
    transcript: 'ललना रे, कोसी के पारे बाजे ढोलक,\nमाई मोरा गावथि सोहर रे ललना।',
    recordedAt: '2026-05-18T17:30:00Z',
    recordedBy: 'Sushila Yadav'
  },
  ai: enrich({
    detectedLanguage: 'Maithili',
    translation: 'O little one, across the Kosi the dholak sounds,\nmy mother is singing the sohar, O little one.',
    summary: 'A Kosi-region variant of the Mithila sohar with a shortened verse structure and drum accompaniment.',
    tags: ['Kosi', 'Maithili', 'variant', 'dholak']
  }),
  community: community('verified', 4),
  relationships: [
  { type: 'REGIONAL_VARIANT', recordId: 'r1' },
  { type: 'RELATED_TRADITION', recordId: 'r11' }]

},
{
  id: 'r3',
  title: 'Chhath at the ghat — the evening arghya',
  description:
  'The offering made to the setting sun on the third day of Chhath. Filmed from the bank at Kamla river, with the women standing waist-deep.',
  category: 'festival',
  region: 'Mithila, Bihar',
  state: 'Bihar',
  coordinates: [26.35, 86.07],
  tradition: 'Chhath observance',
  festival: 'Chhath',
  creatorId: 'u1',
  createdAt: '2026-05-11T06:00:00Z',
  tags: ['chhath', 'river', 'sun worship'],
  likes: 903,
  comments: 71,
  saves: 402,
  featured: true,
  source: {
    media: { type: 'video', posterUrl: IMG.festival, durationSec: 96, altText: 'Villagers gathered with oil lamps and marigold garlands at dusk' },
    language: 'Maithili',
    transcript: 'साँझ के अरघ दैत छी, सूरज देव के हाथ जोड़ि प्रणाम।',
    contributorNote: 'The basket is filled by the eldest woman of each family, never bought ready-made.',
    recordedAt: '2026-05-10T17:40:00Z',
    recordedBy: 'Kamla Devi'
  },
  ai: enrich({
    detectedLanguage: 'Maithili',
    translation: 'We give the evening offering, palms joined in greeting to the sun god.',
    summary:
    'Documentation of the evening arghya during Chhath: offerings of fruit and thekua are raised to the setting sun while standing in the river.',
    tags: ['Chhath', 'sun worship', 'river ritual', 'Bihar', 'women-led observance']
  }),
  community: community('verified', 11),
  relationships: [
  { type: 'SAME_FESTIVAL', recordId: 'r1' },
  { type: 'RELATED_TRADITION', recordId: 'r12' }]

},
{
  id: 'r4',
  title: 'Why the fish is painted twice in Mithila work',
  description:
  'An explanation of the paired-fish motif — fertility, but also the pair of eyes that watch a marriage. Told by the painter while working.',
  category: 'artwork',
  region: 'Mithila, Bihar',
  state: 'Bihar',
  coordinates: [26.36, 86.08],
  tradition: 'Mithila painting',
  artForm: 'Mithila painting',
  creatorId: 'u1',
  createdAt: '2026-04-30T12:00:00Z',
  tags: ['motif', 'madhubani', 'symbolism'],
  likes: 288,
  comments: 22,
  saves: 133,
  source: {
    media: { type: 'image', posterUrl: IMG.mithila, altText: 'Mithila painting with paired fish and lotus motifs in natural pigments' },
    language: 'Maithili',
    transcript:
    'माछ जोड़ा में बनैत छी — एक गोट संतान लेल, दोसर गोट रखबार लेल। कोहबर घर में ई दुनू चाही।',
    recordedAt: '2026-04-29T09:15:00Z',
    recordedBy: 'Kamla Devi'
  },
  ai: enrich({
    detectedLanguage: 'Maithili',
    translation:
    'The fish is made in a pair — one for offspring, the other as a guardian. Both are needed in the kohbar chamber.',
    summary: 'Explains the paired-fish motif in Mithila painting as a dual symbol of fertility and protection within the kohbar marriage chamber.',
    tags: ['Mithila painting', 'kohbar', 'fish motif', 'marriage', 'symbolism']
  }),
  community: community('correction-suggested', 3, {
    corrections: [
    {
      id: 'c2',
      userId: 'u6',
      field: 'Cultural context',
      suggestion: 'In Raghurajpur the paired fish reads as prosperity rather than protection — worth noting the difference.',
      createdAt: '2026-05-02T14:10:00Z',
      accepted: false
    }],

    history: [
    { id: 'h4', action: 'correct', userId: 'u6', note: 'Regional reading differs in Odisha.', createdAt: '2026-05-02T14:10:00Z' }]

  }),
  relationships: [
  { type: 'SAME_ART_FORM', recordId: 'r1' },
  { type: 'RELATED_TRADITION', recordId: 'r9' }]

},
{
  id: 'r5',
  title: 'The tarpa circle — Warli harvest dance',
  description:
  'The spiral dance follows the tarpa player. No one leads; the line simply keeps closing until the whole hamlet is inside it.',
  category: 'traditional-practice',
  region: 'Palghar, Maharashtra',
  state: 'Maharashtra',
  coordinates: [19.7, 72.98],
  tradition: 'Warli wall painting',
  artForm: 'Warli painting',
  festival: 'Tarpa Utsav',
  creatorId: 'u2',
  createdAt: '2026-05-22T18:20:00Z',
  tags: ['warli', 'harvest', 'dance'],
  likes: 651,
  comments: 44,
  saves: 287,
  featured: true,
  source: {
    media: { type: 'image', posterUrl: IMG.warli, altText: 'Warli wall painting of stick figures dancing in a spiral on an ochre mud wall' },
    language: 'Marathi',
    transcript:
    'तारपा वाजला की गोल फेर धरायचा. पहिला माणूस कोण हे कोणी बघत नाही — फेर पूर्ण झाला की नाच सुरू.',
    contributorNote: 'The wall is repainted every year after the harvest. This one was made by four women in one afternoon.',
    recordedAt: '2026-05-21T16:00:00Z',
    recordedBy: 'Jivya Vaghela'
  },
  ai: enrich({
    detectedLanguage: 'Marathi',
    translation:
    'When the tarpa sounds, a circle is formed. Nobody watches for who stands first — once the circle is complete, the dance begins.',
    summary:
    'Describes the Warli tarpa dance, a leaderless spiral performed to a gourd-and-bamboo wind instrument after the harvest, and its depiction on repainted mud walls.',
    tags: ['Warli', 'tarpa', 'harvest', 'Maharashtra', 'community dance']
  }),
  community: community('verified', 8),
  relationships: [
  { type: 'SAME_ART_FORM', recordId: 'r6' },
  { type: 'RELATED_TRADITION', recordId: 'r13' }]

},
{
  id: 'r6',
  title: 'Rice paste and bamboo — preparing Warli colour',
  description: 'The white is ground rice, water and gum. The brush is a chewed bamboo stick. Nothing else enters the wall.',
  category: 'craft',
  region: 'Palghar, Maharashtra',
  state: 'Maharashtra',
  coordinates: [19.72, 72.9],
  tradition: 'Warli wall painting',
  artForm: 'Warli painting',
  creatorId: 'u2',
  createdAt: '2026-04-14T09:30:00Z',
  tags: ['pigment', 'technique', 'warli'],
  likes: 344,
  comments: 19,
  saves: 201,
  source: {
    media: { type: 'video', posterUrl: IMG.warli, durationSec: 142, altText: 'Close view of a Warli mud wall being painted with rice paste' },
    language: 'Marathi',
    transcript: 'तांदूळ भिजवून वाटायचा, त्यात डिंक घालायचा. बांबूची काडी चावून ब्रश करायचा.',
    recordedAt: '2026-04-13T11:00:00Z',
    recordedBy: 'Jivya Vaghela'
  },
  ai: enrich({
    detectedLanguage: 'Marathi',
    translation: 'Soak the rice and grind it, add gum to it. Chew a bamboo stick to make the brush.',
    summary: 'A step-by-step account of preparing traditional Warli white pigment from rice paste and natural gum, applied with a chewed bamboo brush.',
    tags: ['Warli', 'natural pigment', 'rice paste', 'technique', 'bamboo brush']
  }),
  community: community('verified', 5),
  relationships: [
  { type: 'SAME_ART_FORM', recordId: 'r5' },
  { type: 'RELATED_TRADITION', recordId: 'r15' }]

},
{
  id: 'r7',
  title: 'Baul song of the empty boat',
  description:
  'Sung at the Poush Mela akhara at two in the morning. The ektara is tuned only once, at the start, and never again.',
  category: 'folk-song',
  region: 'Birbhum, West Bengal',
  state: 'West Bengal',
  coordinates: [23.68, 87.68],
  tradition: 'Baul',
  artForm: 'Baul singing',
  festival: 'Poush Mela',
  creatorId: 'u3',
  createdAt: '2026-05-26T02:40:00Z',
  tags: ['baul', 'ektara', 'mysticism'],
  likes: 727,
  comments: 58,
  saves: 361,
  featured: true,
  source: {
    media: { type: 'audio', posterUrl: IMG.baul, durationSec: 327, altText: 'Baul singer in saffron robes playing an ektara' },
    language: 'Bengali',
    transcript:
    'খাঁচার ভিতর অচিন পাখি কেমনে আসে যায়,\nতারে ধরতে পারলে মনোবেড়ি দিতাম পাখির পায়।',
    contributorNote: 'Recorded with permission at the akhara. The singer asked that his full name not be listed.',
    recordedAt: '2026-05-25T02:10:00Z',
    recordedBy: 'Anwesha Roy'
  },
  ai: enrich({
    detectedLanguage: 'Bengali',
    translation:
    'How does the unknown bird come and go inside the cage —\nif I could catch it, I would put the mind’s fetter on its feet.',
    summary:
    'A Baul song using the cage-and-bird metaphor for the soul within the body, performed at an all-night akhara during Poush Mela.',
    tags: ['Baul', 'Bengali', 'ektara', 'mysticism', 'Poush Mela', 'soul metaphor']
  }),
  community: community('verified', 9, {
    notes: [
    {
      id: 'n2',
      userId: 'u1',
      body: 'This lyric is attributed to Lalon; many akharas sing it with an added third line that is left out here.',
      createdAt: '2026-05-27T07:00:00Z'
    }]

  }),
  relationships: [
  { type: 'RELATED_SONG', recordId: 'r8' },
  { type: 'SAME_FESTIVAL', recordId: 'r16' }]

},
{
  id: 'r8',
  title: 'How an ektara is tuned by ear',
  description: 'The bamboo is squeezed, not turned. The player explains why a peg would ruin the instrument.',
  category: 'craft',
  region: 'Birbhum, West Bengal',
  state: 'West Bengal',
  coordinates: [23.7, 87.61],
  tradition: 'Baul',
  artForm: 'Baul singing',
  creatorId: 'u3',
  createdAt: '2026-03-19T15:10:00Z',
  tags: ['instrument', 'ektara', 'technique'],
  likes: 219,
  comments: 16,
  saves: 98,
  source: {
    media: { type: 'video', posterUrl: IMG.baul, durationSec: 118, altText: 'Hands squeezing the bamboo frame of an ektara' },
    language: 'Bengali',
    transcript: 'বাঁশ চেপে ধরলে সুর ওঠে, ছেড়ে দিলে নামে। কান ছাড়া আর কিছু লাগে না।',
    recordedAt: '2026-03-18T12:00:00Z',
    recordedBy: 'Anwesha Roy'
  },
  ai: enrich({
    detectedLanguage: 'Bengali',
    translation: 'Press the bamboo and the pitch rises, release it and it falls. Nothing but the ear is needed.',
    summary: 'Explains pitch control on the single-stringed ektara through compression of the bamboo frame rather than a tuning peg.',
    tags: ['ektara', 'instrument making', 'Baul', 'tuning']
  }),
  community: community('verified', 3),
  relationships: [
  { type: 'RELATED_SONG', recordId: 'r7' },
  { type: 'SAME_ART_FORM', recordId: 'r7' }]

},
{
  id: 'r9',
  title: 'Pattachitra: the border is painted last',
  description:
  'A Raghurajpur painter explains the sequence — figures, then ornament, then the border that locks the story inside.',
  category: 'artwork',
  region: 'Puri, Odisha',
  state: 'Odisha',
  coordinates: [19.89, 85.83],
  tradition: 'Pattachitra',
  artForm: 'Pattachitra scroll',
  festival: 'Ratha Yatra',
  creatorId: 'u6',
  createdAt: '2026-05-15T11:45:00Z',
  tags: ['pattachitra', 'technique', 'odisha'],
  likes: 498,
  comments: 33,
  saves: 254,
  source: {
    media: { type: 'image', posterUrl: IMG.pattachitra, altText: 'Pattachitra scroll on cloth being painted with a fine brush' },
    language: 'Odia',
    transcript:
    'ପ୍ରଥମେ ମୂର୍ତ୍ତି, ତା ପରେ ଅଳଙ୍କାର, ଶେଷରେ ବର୍ଡର। ବର୍ଡର ଆଗେ ଆଙ୍କିଲେ କଥା ଭିତରେ ରହିବ ନାହିଁ।',
    contributorNote: 'The cloth is prepared with tamarind seed paste over three days before a single line is drawn.',
    recordedAt: '2026-05-14T10:00:00Z',
    recordedBy: 'Sudarshan Maharana'
  },
  ai: enrich({
    detectedLanguage: 'Odia',
    translation:
    'First the figures, then the ornament, and the border last. If the border is drawn first, the story will not stay inside it.',
    summary: 'Describes the fixed painting order in Pattachitra practice and the preparation of the cloth with tamarind-seed paste.',
    tags: ['Pattachitra', 'Odisha', 'natural pigment', 'Raghurajpur', 'technique']
  }),
  community: community('verified', 7),
  relationships: [
  { type: 'RELATED_TRADITION', recordId: 'r4' },
  { type: 'SAME_FESTIVAL', recordId: 'r10' }]

},
{
  id: 'r10',
  title: 'The chariot ropes of Ratha Yatra',
  description: 'Who is permitted to pull which rope, and the order in which the three chariots may move.',
  category: 'festival',
  region: 'Puri, Odisha',
  state: 'Odisha',
  coordinates: [19.81, 85.83],
  tradition: 'Ratha Yatra observance',
  festival: 'Ratha Yatra',
  creatorId: 'u6',
  createdAt: '2026-04-02T08:00:00Z',
  tags: ['ratha yatra', 'ritual order', 'puri'],
  likes: 812,
  comments: 62,
  saves: 330,
  source: {
    media: { type: 'text', posterUrl: IMG.festival, altText: 'Festival crowd gathered at dusk' },
    language: 'Odia',
    transcript:
    'ତାଳଧ୍ୱଜ ଆଗେ, ତା ପରେ ଦର୍ପଦଳନ, ଶେଷରେ ନନ୍ଦିଘୋଷ। ଏ କ୍ରମ କେବେ ବଦଳେ ନାହିଁ।',
    recordedAt: '2026-04-01T07:00:00Z',
    recordedBy: 'Sudarshan Maharana'
  },
  ai: enrich({
    detectedLanguage: 'Odia',
    translation: 'Taladhwaja first, then Darpadalana, and Nandighosha last. This order has never changed.',
    summary: 'Records the fixed sequence in which the three Ratha Yatra chariots are drawn and the customary allocation of rope duties.',
    tags: ['Ratha Yatra', 'Puri', 'chariot', 'ritual sequence']
  }),
  community: community('pending', 1),
  relationships: [{ type: 'SAME_FESTIVAL', recordId: 'r9' }]
},
{
  id: 'r11',
  title: 'Kalbelia song for the monsoon that did not come',
  description:
  'A drought song from the Jaisalmer belt. Sung standing, never seated, and only by women of the household.',
  category: 'folk-song',
  region: 'Jaisalmer, Rajasthan',
  state: 'Rajasthan',
  coordinates: [26.91, 70.92],
  tradition: 'Kalbelia',
  artForm: 'Kalbelia dance',
  festival: 'Teej',
  creatorId: 'u4',
  createdAt: '2026-05-24T20:00:00Z',
  tags: ['drought', 'kalbelia', 'rajasthan'],
  likes: 389,
  comments: 27,
  saves: 172,
  source: {
    media: { type: 'audio', posterUrl: IMG.kalbelia, durationSec: 198, altText: 'Kalbelia dancer mid-spin in a mirrored black skirt' },
    language: 'Rajasthani',
    transcript: 'बादळिया रे, थारो रस्तो कठै भूल्यो,\nधरती फाटी, कुआं सूख्या रे।',
    contributorNote: 'My grandmother sang this in 1987 and again in 2019. Both were drought years.',
    recordedAt: '2026-05-23T19:00:00Z',
    recordedBy: 'Rukma Sapera'
  },
  ai: enrich({
    detectedLanguage: 'Rajasthani (Marwari)',
    translation: 'O little cloud, where did you lose your road —\nthe earth has cracked, the wells have dried.',
    summary: 'A Kalbelia drought song addressing the monsoon cloud directly, performed standing by women during years of failed rain.',
    tags: ['Kalbelia', 'Marwari', 'drought', 'monsoon', 'women’s repertoire']
  }),
  community: community('verified', 5),
  relationships: [
  { type: 'RELATED_SONG', recordId: 'r1' },
  { type: 'SAME_ART_FORM', recordId: 'r12' },
  { type: 'SAME_FESTIVAL', recordId: 'r17' }]

},
{
  id: 'r12',
  title: 'The Kalbelia spin — counting by the skirt',
  description: 'The dancer counts rotations by the weight of the ghagra, not by the drum. Explained and demonstrated.',
  category: 'traditional-practice',
  region: 'Jaisalmer, Rajasthan',
  state: 'Rajasthan',
  coordinates: [26.88, 70.99],
  tradition: 'Kalbelia',
  artForm: 'Kalbelia dance',
  creatorId: 'u4',
  createdAt: '2026-02-08T17:00:00Z',
  tags: ['dance', 'technique', 'kalbelia'],
  likes: 267,
  comments: 21,
  saves: 121,
  source: {
    media: { type: 'video', posterUrl: IMG.kalbelia, durationSec: 87, altText: 'Kalbelia dancer spinning at an evening gathering' },
    language: 'Rajasthani',
    transcript: 'घाघरो भारी हुवै जद गिणती सरू। ढोल नीं, घाघरो बतावै।',
    recordedAt: '2026-02-07T18:20:00Z',
    recordedBy: 'Rukma Sapera'
  },
  ai: enrich({
    detectedLanguage: 'Rajasthani (Marwari)',
    translation: 'When the skirt grows heavy the count begins. Not the drum — the skirt tells you.',
    summary: 'Describes how Kalbelia dancers pace rotations by the momentum of the weighted ghagra rather than by percussion cues.',
    tags: ['Kalbelia', 'dance technique', 'ghagra', 'Rajasthan']
  }),
  community: community('verified', 4),
  relationships: [
  { type: 'SAME_ART_FORM', recordId: 'r11' },
  { type: 'RELATED_TRADITION', recordId: 'r3' }]

},
{
  id: 'r13',
  title: 'Theyyam: the moment the performer stops being himself',
  description:
  'A Peruvannan performer describes the point in the kaliyattam at which the community stops addressing him by name.',
  category: 'oral-tradition',
  region: 'Kannur, Kerala',
  state: 'Kerala',
  coordinates: [11.87, 75.37],
  tradition: 'Theyyam',
  artForm: 'Theyyam performance',
  festival: 'Theyyam Kaliyattam',
  creatorId: 'u5',
  createdAt: '2026-05-19T21:30:00Z',
  tags: ['theyyam', 'ritual', 'kerala'],
  likes: 1044,
  comments: 96,
  saves: 512,
  featured: true,
  source: {
    media: { type: 'audio', posterUrl: IMG.theyyam, durationSec: 402, altText: 'Theyyam performer in a red headdress in a temple courtyard at dusk' },
    language: 'Malayalam',
    transcript:
    'മുഖത്തെഴുത്ത് കഴിഞ്ഞ് കണ്ണാടി നോക്കുമ്പോൾ — അപ്പോൾ മുതൽ എന്റെ പേര് ആരും വിളിക്കില്ല.',
    contributorNote: 'Recorded in the kavu the night before the kaliyattam. He asked that the mirror moment not be filmed.',
    recordedAt: '2026-05-18T20:00:00Z',
    recordedBy: 'Balan Peruvannan'
  },
  ai: enrich({
    detectedLanguage: 'Malayalam',
    translation:
    'When the face-writing is done and I look into the mirror — from that moment nobody calls me by my name.',
    summary:
    'A first-person account of the mirror moment in Theyyam, when the performer is regarded as the deity and is no longer addressed personally.',
    tags: ['Theyyam', 'Malayalam', 'Kannur', 'ritual transformation', 'mukhathezhuthu']
  }),
  community: community('verified', 14),
  relationships: [
  { type: 'RELATED_TRADITION', recordId: 'r14' },
  { type: 'SAME_FESTIVAL', recordId: 'r14' }]

},
{
  id: 'r14',
  title: 'Making the Theyyam headdress from areca spathe',
  description: 'The mudi is rebuilt for every season. Bamboo frame, areca sheath, and pigment ground the same morning.',
  category: 'craft',
  region: 'Kannur, Kerala',
  state: 'Kerala',
  coordinates: [11.9, 75.42],
  tradition: 'Theyyam',
  artForm: 'Theyyam performance',
  festival: 'Theyyam Kaliyattam',
  creatorId: 'u5',
  createdAt: '2026-01-27T13:00:00Z',
  tags: ['headdress', 'craft', 'theyyam'],
  likes: 431,
  comments: 30,
  saves: 219,
  source: {
    media: { type: 'image', posterUrl: IMG.theyyam, altText: 'Theyyam performer wearing an elaborate red and orange headdress' },
    language: 'Malayalam',
    transcript: 'മുടി ഓരോ കൊല്ലവും പുതിയത് കെട്ടണം. പഴയത് സൂക്ഷിക്കില്ല.',
    recordedAt: '2026-01-26T09:00:00Z',
    recordedBy: 'Balan Peruvannan'
  },
  ai: enrich({
    detectedLanguage: 'Malayalam',
    translation: 'The mudi must be tied new every year. The old one is not kept.',
    summary: 'Documents the annual rebuilding of the Theyyam headdress from bamboo and areca spathe, and the practice of never reusing the previous season’s mudi.',
    tags: ['Theyyam', 'headdress', 'areca', 'craft', 'Kerala']
  }),
  community: community('verified', 6),
  relationships: [
  { type: 'SAME_ART_FORM', recordId: 'r13' },
  { type: 'RELATED_TRADITION', recordId: 'r6' }]

},
{
  id: 'r15',
  title: 'The wheel song of Khavda potters',
  description:
  'A working song kept in time with the wheel. When the wheel slows, the verse stretches; the song is a clock.',
  category: 'folk-song',
  region: 'Kutch, Gujarat',
  state: 'Gujarat',
  coordinates: [23.86, 69.71],
  tradition: 'Terracotta pottery',
  artForm: 'Wheel pottery',
  creatorId: 'u7',
  createdAt: '2026-05-08T14:20:00Z',
  tags: ['work song', 'pottery', 'kutch'],
  likes: 205,
  comments: 18,
  saves: 94,
  source: {
    media: { type: 'audio', posterUrl: IMG.pottery, durationSec: 156, altText: 'Potter’s hands shaping wet clay on a spinning wheel' },
    language: 'Kutchi',
    transcript: 'ચાકડો ફરે, માટી ઊઠે, હાથ ધીમા થાય તો ગીત લાંબું થાય.',
    contributorNote: 'My father sang it faster. The wheel was hand-turned then.',
    recordedAt: '2026-05-07T11:00:00Z',
    recordedBy: 'Meera Nathwani'
  },
  ai: enrich({
    detectedLanguage: 'Kutchi',
    translation: 'The wheel turns, the clay rises; if the hands slow, the song grows longer.',
    summary: 'A Kutchi potter’s work song whose tempo is tied to the speed of the wheel, functioning as a timing device during throwing.',
    tags: ['Kutchi', 'work song', 'pottery', 'Khavda', 'Gujarat']
  }),
  community: community('pending', 2),
  relationships: [
  { type: 'RELATED_TRADITION', recordId: 'r6' },
  { type: 'SAME_ART_FORM', recordId: 'r18' }]

},
{
  id: 'r16',
  title: 'Poush Mela: three days of the open akhara',
  description:
  'How the fairground is divided, who may sing where, and why the last night is left unscheduled.',
  category: 'festival',
  region: 'Birbhum, West Bengal',
  state: 'West Bengal',
  coordinates: [23.67, 87.69],
  tradition: 'Baul',
  festival: 'Poush Mela',
  creatorId: 'u3',
  createdAt: '2026-03-05T10:00:00Z',
  tags: ['poush mela', 'baul', 'gathering'],
  likes: 356,
  comments: 25,
  saves: 148,
  source: {
    media: { type: 'text', posterUrl: IMG.festival, altText: 'Evening gathering with lamps and garlands' },
    language: 'Bengali',
    transcript: 'শেষ রাত কারও জন্য বরাদ্দ নয়। যে গায় সে বসে, বাকিরা শোনে।',
    recordedAt: '2026-03-04T23:00:00Z',
    recordedBy: 'Anwesha Roy'
  },
  ai: enrich({
    detectedLanguage: 'Bengali',
    translation: 'The last night is allotted to no one. Whoever sings, sits; the rest listen.',
    summary: 'Describes the spatial and social organisation of the Poush Mela akhara, including the deliberately unscheduled final night.',
    tags: ['Poush Mela', 'Baul', 'Birbhum', 'gathering', 'akhara']
  }),
  community: community('verified', 8),
  relationships: [{ type: 'SAME_FESTIVAL', recordId: 'r7' }]
},
{
  id: 'r17',
  title: 'Teej swings and the songs tied to the rope',
  description:
  'The verses change with the height of the swing. Recorded across four households in one afternoon.',
  category: 'traditional-practice',
  region: 'Alwar, Rajasthan',
  state: 'Rajasthan',
  coordinates: [27.55, 76.62],
  tradition: 'Teej observance',
  festival: 'Teej',
  creatorId: 'u4',
  createdAt: '2026-04-21T16:00:00Z',
  tags: ['teej', 'swing songs', 'monsoon'],
  likes: 298,
  comments: 20,
  saves: 137,
  source: {
    media: { type: 'audio', posterUrl: IMG.festival, durationSec: 231, altText: 'Village festival gathering with marigold garlands' },
    language: 'Rajasthani',
    transcript: 'हिंडो ऊंचो जावै जद गीत बदळै, नीचो आवै जद फेर पैलो गीत।',
    recordedAt: '2026-04-20T15:00:00Z',
    recordedBy: 'Rukma Sapera'
  },
  ai: enrich({
    detectedLanguage: 'Rajasthani (Marwari)',
    translation: 'When the swing goes high the song changes; when it comes down, the first song returns.',
    summary: 'Documents Teej swing songs whose verse selection is governed by the arc of the swing itself.',
    tags: ['Teej', 'swing song', 'monsoon', 'Rajasthan', 'women’s repertoire']
  }),
  community: community('flagged', 2, {
    history: [
    { id: 'h5', action: 'flag', userId: 'u1', note: 'Two of the four households were recorded without an explicit consent note.', createdAt: '2026-04-23T09:00:00Z' }]

  }),
  relationships: [{ type: 'SAME_FESTIVAL', recordId: 'r11' }]
},
{
  id: 'r18',
  title: 'Why Khavda clay is dug only after the rains',
  description: 'The Rann silt is workable for eleven weeks a year. The potter explains how the window is judged.',
  category: 'craft',
  region: 'Kutch, Gujarat',
  state: 'Gujarat',
  coordinates: [23.9, 69.75],
  tradition: 'Terracotta pottery',
  artForm: 'Wheel pottery',
  creatorId: 'u7',
  createdAt: '2026-05-03T09:00:00Z',
  tags: ['clay', 'seasonality', 'kutch'],
  likes: 187,
  comments: 12,
  saves: 88,
  source: {
    media: { type: 'image', posterUrl: IMG.pottery, altText: 'Rows of drying earthen pots in a village workshop' },
    language: 'Kutchi',
    transcript: 'વરસાદ પછી જ માટી કાઢાય. પહેલાં કાઢો તો વાસણ ફાટે.',
    recordedAt: '2026-05-02T08:00:00Z',
    recordedBy: 'Meera Nathwani'
  },
  ai: enrich({
    detectedLanguage: 'Kutchi',
    translation: 'The clay is dug only after the rains. Dig earlier and the vessel cracks.',
    summary: 'Explains the seasonal window for extracting workable Rann silt in Khavda and the consequences of digging outside it.',
    tags: ['Kutch', 'clay', 'seasonality', 'pottery', 'Rann']
  }),
  community: community('verified', 4),
  relationships: [{ type: 'SAME_ART_FORM', recordId: 'r15' }]
},
{
  id: 'r19',
  title: 'My grandmother on the village before the embankment',
  description:
  'An interview recording. She describes the three houses that stood where the river now runs, and who lived in them.',
  category: 'local-history',
  region: 'Birbhum, West Bengal',
  state: 'West Bengal',
  coordinates: [23.75, 87.55],
  tradition: 'Oral history',
  creatorId: 'me',
  createdAt: '2026-06-01T18:00:00Z',
  tags: ['oral history', 'river', 'memory'],
  likes: 64,
  comments: 9,
  saves: 31,
  fromInterview: true,
  source: {
    media: { type: 'audio', posterUrl: IMG.elder, durationSec: 486, altText: 'Elderly woman seated on a charpai, telling a story' },
    language: 'Bengali',
    transcript:
    'বাঁধ হওয়ার আগে ওখানে তিনটে ঘর ছিল। মাঝেরটা ছিল হরিপদ কাকার। এখন জল।',
    contributorNote: 'Recorded on my phone in her room. She stops twice — I have not cut those pauses out.',
    recordedAt: '2026-05-31T16:00:00Z',
    recordedBy: 'Sarojini Sen'
  },
  ai: enrich({
    status: 'COMPLETED',
    detectedLanguage: 'Bengali',
    translation:
    'Before the embankment there were three houses there. The middle one was Haripada uncle’s. Now it is water.',
    summary:
    'An oral-history account of three households displaced by embankment construction, naming residents and locating the site relative to the present river course.',
    tags: ['oral history', 'Birbhum', 'displacement', 'embankment', 'Bengali']
  }),
  community: community('pending', 0),
  relationships: [{ type: 'RELATED_TRADITION', recordId: 'r16' }]
},
{
  id: 'r20',
  title: 'The harvest count song of Bastar',
  description:
  'A counting song used while measuring grain. The AI enrichment did not complete on this record — the original is intact.',
  category: 'folk-song',
  region: 'Bastar, Chhattisgarh',
  state: 'Chhattisgarh',
  coordinates: [19.07, 81.95],
  tradition: 'Ghotul storytelling',
  creatorId: 'me',
  createdAt: '2026-06-03T07:30:00Z',
  tags: ['harvest', 'counting song', 'bastar'],
  likes: 22,
  comments: 3,
  saves: 11,
  source: {
    media: { type: 'audio', posterUrl: IMG.festival, durationSec: 143, altText: 'Village gathering at dusk in Bastar' },
    language: 'Halbi',
    transcript: 'एक पैली, दुइ पैली, तीन पैली — गिनती गीत संग चलै।',
    contributorNote: 'Recorded at the threshing floor. There is wind noise in the first thirty seconds.',
    recordedAt: '2026-06-02T06:40:00Z',
    recordedBy: 'Aarav Sen'
  },
  ai: {
    status: 'FAILED',
    tags: [],
    failureReason: 'Audio could not be separated from background wind noise during transcription.'
  },
  community: community('pending', 0),
  relationships: [{ type: 'RELATED_SONG', recordId: 'r15' }]
}];


export function getRecord(id: string): CulturalRecord | undefined {
  return records.find((r) => r.id === id);
}