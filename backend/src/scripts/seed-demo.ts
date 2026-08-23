/**
 * Idempotent demo-data seed script for Viranikosh.
 * Run: npx tsx src/scripts/seed-demo.ts
 *
 * Uses createMany with skipDuplicates and transactional batching
 * to handle remote Supabase latency efficiently.
 */

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ log: ["error", "warn"] });
const HASH = bcrypt.hashSync("Demo@12345", 12);

// ── User data ────────────────────────────────────────────────────────────
const USERS = [
  { email: "kamla@example.com", name: "Kamla Devi", role: "USER" },
  { email: "jivya@example.com", name: "Jivya Vaghela", role: "USER" },
  { email: "anwesha@example.com", name: "Anwesha Roy", role: "USER" },
  { email: "rukma@example.com", name: "Rukma Sapera", role: "USER" },
  { email: "balan@example.com", name: "Balan Peruvannan", role: "USER" },
  { email: "sudarshan@example.com", name: "Sudarshan Maharana", role: "USER" },
  { email: "meera@example.com", name: "Meera Nathwani", role: "USER" },
  { email: "aarav@example.com", name: "Aarav Sen", role: "USER" },
  { email: "demo@viranikosh.com", name: "Demo User", role: "USER" },
  { email: "admin@viranikosh.com", name: "Admin User", role: "ADMIN" },
];

const PROFILES = [
  { email: "kamla@example.com", bio: "Sings the Sohar and Samdaun of Mithila.", location: "Madhubani, Bihar", avatar: "/avatars/kamla.jpg" },
  { email: "jivya@example.com", bio: "Warli painter from Ganjad.", location: "Palghar, Maharashtra", avatar: "/avatars/jivya.jpg" },
  { email: "anwesha@example.com", bio: "Documenting Baul akharas across Birbhum.", location: "Birbhum, West Bengal", avatar: "/avatars/anwesha.jpg" },
  { email: "rukma@example.com", bio: "Kalbelia dancer and singer. Third generation.", location: "Jaisalmer, Rajasthan", avatar: "/avatars/rukma.jpg" },
  { email: "balan@example.com", bio: "Theyyam performer, Kannur. Forty-one seasons.", location: "Kannur, Kerala", avatar: "/avatars/balan.jpg" },
  { email: "sudarshan@example.com", bio: "Pattachitra artist from Raghurajpur.", location: "Puri, Odisha", avatar: "/avatars/sudarshan.jpg" },
  { email: "meera@example.com", bio: "Potter in Khavda, Kutch.", location: "Kutch, Gujarat", avatar: "/avatars/meera.jpg" },
  { email: "aarav@example.com", bio: "Recording my grandmother's songs.", location: "Birbhum, West Bengal", avatar: "/avatars/aarav.jpg" },
  { email: "demo@viranikosh.com", bio: "Demo account.", location: "Kolkata, West Bengal", avatar: "/avatars/demo.jpg" },
  { email: "admin@viranikosh.com", bio: "Platform administrator.", location: "New Delhi", avatar: "/avatars/admin.jpg" },
];

const CATEGORIES: [string, string][] = [
  ["folk-song", "Traditional songs passed down orally"],
  ["folk-story", "Oral narratives and fables"],
  ["oral-tradition", "Knowledge transmitted verbally"],
  ["artwork", "Visual and performing arts"],
  ["craft", "Handmade traditional crafts"],
  ["festival", "Cultural and religious festivals"],
  ["local-history", "Place-specific oral histories"],
  ["traditional-practice", "Rituals and living practices"],
];

const REGIONS: [string, string, number, number][] = [
  ["Mithila, Bihar", "Bihar", 26.13, 85.9],
  ["Palghar, Maharashtra", "Maharashtra", 19.69, 72.82],
  ["Birbhum, West Bengal", "West Bengal", 23.87, 87.62],
  ["Jaisalmer, Rajasthan", "Rajasthan", 26.92, 70.91],
  ["Kannur, Kerala", "Kerala", 11.87, 75.37],
  ["Puri, Odisha", "Odisha", 19.81, 85.83],
  ["Kutch, Gujarat", "Gujarat", 23.73, 68.51],
  ["Bastar, Chhattisgarh", "Chhattisgarh", 19.1, 81.25],
  ["Jhargram, West Bengal", "West Bengal", 22.45, 86.95],
  ["Alwar, Rajasthan", "Rajasthan", 27.56, 76.63],
  ["Thanjavur, Tamil Nadu", "Tamil Nadu", 10.79, 79.13],
  ["Majuli, Assam", "Assam", 26.95, 94.62],
];

const LANGUAGES: [string, string][] = [
  ["Maithili", "mai"], ["Marathi", "mr"], ["Bengali", "bn"],
  ["Rajasthani", "raj"], ["Malayalam", "ml"], ["Odia", "or"],
  ["Kutchi", "kfr"], ["Halbi", "hlb"], ["Santali", "sat"],
  ["Tamil", "ta"], ["Assamese", "as"], ["Hindi", "hi"], ["English", "en"],
];

const TAGS = [
  "birth-ritual", "maithili", "mithila", "sohar", "womens-song",
  "kosi", "variant", "chhath", "river", "sun-worship", "bihar",
  "warli", "tribal-art", "harvest", "painting", "maharashtra",
  "baul", "bengal", "mystical", "monsoon", "akharas",
  "kalbelia", "dance", "rajasthani", "unesco", "serpent",
  "theyyam", "ritual", "kerala", "kavu", "deity",
  "pattachitra", "scroll-painting", "natural-pigments", "odisha",
  "pottery", "kutchi", "work-songs", "terracotta", "women-artisans",
  "ghotul", "muria", "storytelling", "bastar", "tribal",
  "chhau", "mask-making", "papier-mache", "west-bengal",
  "bhavai", "folk-theatre", "acrobatics", "rajasthan",
  "sattriya", "classical-dance", "assam", "sattras",
  "rogan-art", "castor-oil", "textile-craft",
  "bhagavata-mela", "dance-drama", "thanjavur", "vishnu",
];

// ── Post data (title, desc, content, lat, lng, userEmail, region, category, tags[]) ──
const POSTS: [string, string, string, number, number, string, string, string, string[]][] = [
  ["Sohar — the birth song of Mithila", "Sung by women on the sixth night after birth.", "Maithili birth song with lamp imagery.", 26.13, 85.9, "kamla@example.com", "Mithila, Bihar", "folk-song", ["birth-ritual", "maithili", "mithila", "sohar", "womens-song"]],
  ["Sohar as sung in Saharsa — the Kosi variant", "Same song, different melody across the Kosi.", "Kosi-region variant with drum.", 25.88, 86.6, "anwesha@example.com", "Mithila, Bihar", "folk-song", ["sohar", "kosi", "maithili", "variant"]],
  ["Chhath at the ghat — the evening arghya", "Offering to the setting sun.", "Sun worship at Kamla river.", 26.35, 86.07, "kamla@example.com", "Mithila, Bihar", "festival", ["chhath", "river", "sun-worship", "bihar"]],
  ["Warli painting of the harvest cycle", "Three-day painting on community hall wall.", "Warli tribal art with rice paste pigment.", 19.69, 72.82, "jivya@example.com", "Palghar, Maharashtra", "artwork", ["warli", "tribal-art", "harvest", "painting", "maharashtra"]],
  ["Baul song at Tarakpur akhara", "Improvised monsoon verse.", "Syncretic Baul tradition of Bengal.", 23.87, 87.62, "anwesha@example.com", "Birbhum, West Bengal", "folk-song", ["baul", "bengal", "mystical", "monsoon", "akharas"]],
  ["Kalbelia dance — the serpent spiral", "Spiralling movements at village fair.", "UNESCO Kalbelia dance from Rajasthan.", 25.75, 71.39, "rukma@example.com", "Jaisalmer, Rajasthan", "traditional-practice", ["kalbelia", "dance", "rajasthani", "unesco", "serpent"]],
  ["Theyyam at Chembilode kavu", "Kari Kuttiyyattam Theyyam performance.", "Ritual art of North Kerala.", 11.87, 75.37, "balan@example.com", "Kannur, Kerala", "traditional-practice", ["theyyam", "ritual", "kerala", "kavu", "deity"]],
  ["Pattachitra — painting the Ramayana scroll", "12-foot scroll with natural pigments.", "Traditional Odisha scroll painting.", 19.81, 85.83, "sudarshan@example.com", "Puri, Odisha", "artwork", ["pattachitra", "scroll-painting", "natural-pigments", "odisha"]],
  ["Songs of the turning wheel — Khavda pottery", "Work songs of women potters.", "Kutch pottery craft with songs.", 23.73, 68.51, "meera@example.com", "Kutch, Gujarat", "craft", ["pottery", "kutchi", "work-songs", "terracotta", "women-artisans"]],
  ["Ghotul nights — the Muria storyteller", "Creation myth at youth dormitory.", "Muria tribal storytelling tradition.", 19.1, 81.25, "aarav@example.com", "Bastar, Chhattisgarh", "oral-tradition", ["ghotul", "muria", "storytelling", "bastar", "tribal"]],
  ["Making a Chhau dance mask", "Papier-mâché mask shaping.", "Jhargram Chhau mask artisans.", 22.45, 86.95, "aarav@example.com", "Jhargram, West Bengal", "craft", ["chhau", "mask-making", "papier-mache", "west-bengal"]],
  ["Bhavai — the balancing act of Rajasthan", "Seven brass pots and comic dialogue.", "Folk theatre with acrobatics.", 27.56, 76.63, "rukma@example.com", "Alwar, Rajasthan", "artwork", ["bhavai", "folk-theatre", "acrobatics", "rajasthan"]],
  ["Sattriya — dance of Assam's monasteries", "Nritta and Abhinaya at Kamalabari Satra.", "Classical dance from Vaishnavite tradition.", 26.95, 94.62, "anwesha@example.com", "Majuli, Assam", "traditional-practice", ["sattriya", "classical-dance", "assam", "sattras"]],
  ["Rogan painting — castor oil art of Kutch", "Castor oil paste on fabric.", "Single-family art from Nirona village.", 23.45, 69.52, "meera@example.com", "Kutch, Gujarat", "craft", ["rogan-art", "castor-oil", "textile-craft"]],
  ["Temple dance — Thanjavur Bhagavata Mela", "Behind-the-scenes of dance-drama prep.", "Traditional Bharatanatyam theatre.", 10.79, 79.13, "aarav@example.com", "Thanjavur, Tamil Nadu", "traditional-practice", ["bhagavata-mela", "dance-drama", "thanjavur", "vishnu"]],
];

async function main() {
  console.log("Seeding Viranikosh demo data...\n");

  // ── 1. Users (bulk upsert) ──────────────────────────────────────────
  console.log("Users...");
  await prisma.user.createMany({
    data: USERS.map(u => ({ ...u, password: HASH })),
    skipDuplicates: true,
  });

  const dbUsers = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
  const userByEmail = Object.fromEntries(dbUsers.map(u => [u.email, u.id]));

  // ── 2. Profiles ────────────────────────────────────────────────────
  console.log("Profiles...");
  for (const p of PROFILES) {
    const userId = userByEmail[p.email];
    if (!userId) continue;
    const existing = await prisma.profile.findUnique({ where: { userId } });
    if (!existing) {
      await prisma.profile.create({ data: { userId, bio: p.bio, location: p.location, avatar: p.avatar } });
    }
  }

  // ── 3. Taxonomy ────────────────────────────────────────────────────
  console.log("Taxonomy...");
  await prisma.culturalCategory.createMany({
    data: CATEGORIES.map(([name, description]) => ({ name, description })),
    skipDuplicates: true,
  });
  await prisma.region.createMany({
    data: REGIONS.map(([name, state, lat, lng]) => ({ name, state, country: "India", lat, lng })),
    skipDuplicates: true,
  });
  await prisma.language.createMany({
    data: LANGUAGES.map(([name, code]) => ({ name, code })),
    skipDuplicates: true,
  });
  await prisma.tag.createMany({
    data: TAGS.map(name => ({ name })),
    skipDuplicates: true,
  });

  // Fetch taxonomy IDs
  const dbCats = await prisma.culturalCategory.findMany({ select: { id: true, name: true } });
  const catByName = Object.fromEntries(dbCats.map(c => [c.name, c.id]));
  const dbRegions = await prisma.region.findMany({ select: { id: true, name: true } });
  const regByName = Object.fromEntries(dbRegions.map(r => [r.name, r.id]));
  const dbLangs = await prisma.language.findMany({ select: { id: true, code: true } });
  const langByCode = Object.fromEntries(dbLangs.map(l => [l.code, l.id]));
  const dbTags = await prisma.tag.findMany({ select: { id: true, name: true } });
  const tagByName = Object.fromEntries(dbTags.map(t => [t.name, t.id]));

  // ── 4. Posts ────────────────────────────────────────────────────────
  console.log("Posts...");
  const postIds: string[] = [];
  for (const [title, desc, content, lat, lng, userEmail, region, category, tags] of POSTS) {
    const userId = userByEmail[userEmail];
    if (!userId) continue;
    const existing = await prisma.culturalPost.findFirst({ where: { title, userId } });
    if (existing) {
      postIds.push(existing.id);
      continue;
    }
    const post = await prisma.culturalPost.create({
      data: {
        title, description: desc, content,
        latitude: lat, longitude: lng,
        published: true, userId,
        regionId: regByName[region],
        categoryId: catByName[category],
      },
    });
    // Tag associations
    const tagData = tags.map(t => ({ postId: post.id, tagId: tagByName[t]! })).filter(d => d.tagId);
    if (tagData.length > 0) {
      await prisma.tagOnPost.createMany({ data: tagData, skipDuplicates: true });
    }
    postIds.push(post.id);
  }
  console.log(`  ${postIds.length} posts`);

  // ── 5. Media ────────────────────────────────────────────────────────
  console.log("Media...");
  const mediaTypes: { mimeType: string; ext: string; size: number }[] = [
    { mimeType: "audio/mpeg", ext: "mp3", size: 2400000 },
    { mimeType: "image/jpeg", ext: "jpg", size: 800000 },
    { mimeType: "video/mp4", ext: "mp4", size: 15000000 },
  ];
  const mediaData = postIds.map((postId, i) => {
    const mt = mediaTypes[i % 3]!;
    const type = mt.mimeType.split("/")[0]!;
    return { url: `/files/demo/media-${i + 1}.${mt.ext}`, type, mimeType: mt.mimeType, size: mt.size, filename: `demo-media-${i + 1}.${mt.ext}`, postId };
  });
  // Check which posts already have media
  const existingMedia = await prisma.media.findMany({ select: { postId: true } });
  const postsWithMedia = new Set(existingMedia.map(m => m.postId));
  const newMedia = mediaData.filter(m => !postsWithMedia.has(m.postId));
  if (newMedia.length > 0) {
    await prisma.media.createMany({ data: newMedia, skipDuplicates: true });
  }

  // ── 6. Transcripts & Translations ───────────────────────────────────
  console.log("Transcripts & Translations...");
  const transcripts: [number, string, string][] = [
    [0, "ललना रे, आजु भेल अङ्गना उजोर, सासु मोरा गावथि सोहर रे ललना।", "mai"],
    [1, "ललना रे, कोसी के पारे बाजे ढोलक, माई मोरा गावथि सोहर रे ललना।", "mai"],
    [4, "আমি মনে করি সুন্দর সুন্দর বনে বনে, বউল পাখির ডানায় উড়ে যায়।", "bn"],
  ];
  for (const [idx, content, langCode] of transcripts) {
    const postId = postIds[idx];
    const langId = langByCode[langCode];
    if (!postId || !langId) continue;
    const existing = await prisma.transcript.findFirst({ where: { postId, languageId: langId } });
    if (!existing) {
      await prisma.transcript.create({ data: { content, postId, languageId: langId } });
    }
  }

  const translations: [number, string][] = [
    [0, "O little one, today the courtyard has grown bright — my mother-in-law is singing the sohar."],
    [1, "O little one, across the Kosi the dholak sounds — my mother is singing the sohar."],
    [4, "I think of the beautiful forests, where the baul bird flies on its wings."],
  ];
  const engId = langByCode["en"];
  for (const [idx, content] of translations) {
    const postId = postIds[idx];
    if (!postId || !engId) continue;
    const existing = await prisma.translation.findFirst({ where: { postId, languageId: engId } });
    if (!existing) {
      await prisma.translation.create({ data: { content, postId, languageId: engId } });
    }
  }

  // ── 7. Comments ────────────────────────────────────────────────────
  console.log("Comments...");
  const commentTexts: [number, number, string][] = [
    [0, 2, "The lamp verse in Madhubani sohar is slightly different from what we have."],
    [0, 1, "Beautiful recording. The responsiveness of the chorus is remarkable."],
    [0, 3, "In Jaisalmer we have a different birth song, but the naming structure is the same."],
    [1, 0, "The Kosi variant is the older version, actually. The dholak was added later."],
    [2, 4, "The evening arghya at the river reminds me of the Theyyam rituals at the kavu."],
    [3, 2, "This is incredible documentation of the harvest cycle."],
    [3, 6, "I have seen similar motifs on Khavda pottery."],
    [4, 0, "The improvisation during monsoon season has a special quality."],
    [4, 5, "We have a similar tradition of wandering minstrels in Odisha."],
    [6, 7, "The Kari Kuttiyyattam Theyyam is one of the most powerful ones."],
    [6, 2, "This is extraordinary documentation. The face painting alone takes hours."],
    [8, 1, "The rhythm of the pottery songs is fascinating — it matches the wheel rotation."],
    [8, 0, "In Mithila we have similar work songs for pottery."],
    [9, 4, "The Muria creation myth has elements similar to some Theyyam stories."],
    [10, 5, "The mask-making technique is similar to some Pattachitra border decorations."],
    [11, 3, "The balancing act is incredible. Bhavai performers train from childhood."],
    [12, 2, "Sattriya is one of the most under-documented classical forms."],
    [13, 1, "Rogan art is incredibly delicate. Only one family still practices it."],
    [14, 4, "Bhagavata Mela is a wonderful example of dance and drama together."],
  ];
  const commentData = commentTexts
    .map(([postIdx, userIdx, content]) => ({
      postId: postIds[postIdx]!,
      userId: dbUsers[userIdx]!.id,
      content,
    }))
    .filter(c => c.postId && c.userId);
  if (commentData.length > 0) {
    await prisma.comment.createMany({ data: commentData, skipDuplicates: true });
  }

  // ── 8. Likes & Saves (bulk) ────────────────────────────────────────
  console.log("Likes & Saves...");
  const likeData: { userId: string; postId: string }[] = [];
  const saveData: { userId: string; postId: string }[] = [];
  for (const user of dbUsers) {
    for (let i = 0; i < postIds.length; i++) {
      if ((i + user.name.length) % 3 === 0) likeData.push({ userId: user.id, postId: postIds[i]! });
      if ((i + user.name.length) % 5 === 0) saveData.push({ userId: user.id, postId: postIds[i]! });
    }
  }
  await prisma.like.createMany({ data: likeData, skipDuplicates: true });
  await prisma.save.createMany({ data: saveData, skipDuplicates: true });
  console.log(`  ${likeData.length} likes, ${saveData.length} saves`);

  // ── 9. Follows (bulk) ──────────────────────────────────────────────
  console.log("Follows...");
  const followData: { followerId: string; followingId: string }[] = [];
  const demoId = userByEmail["demo@viranikosh.com"];
  // Demo follows all 7 knowledge holders
  for (const email of ["kamla@example.com", "jivya@example.com", "anwesha@example.com", "rukma@example.com", "balan@example.com", "sudarshan@example.com", "meera@example.com"]) {
    const targetId = userByEmail[email];
    if (demoId && targetId) followData.push({ followerId: demoId, followingId: targetId });
  }
  // Knowledge holders follow each other (sparse)
  const khEmails = ["kamla@example.com", "jivya@example.com", "anwesha@example.com", "rukma@example.com", "balan@example.com", "sudarshan@example.com", "meera@example.com"];
  for (const src of khEmails) {
    for (const tgt of khEmails) {
      if (src === tgt) continue;
      if ((src.length + tgt.length) % 4 === 0) {
        followData.push({ followerId: userByEmail[src]!, followingId: userByEmail[tgt]! });
      }
    }
  }
  await prisma.follow.createMany({ data: followData, skipDuplicates: true });
  console.log(`  ${followData.length} follows`);

  // ── 10. Interests ──────────────────────────────────────────────────
  console.log("Interests...");
  const interestData: { userId: string; categoryId: string }[] = [];
  const interestMap: [string, string[]][] = [
    ["demo@viranikosh.com", ["folk-song", "oral-tradition", "festival", "artwork"]],
    ["kamla@example.com", ["folk-song", "traditional-practice"]],
    ["anwesha@example.com", ["folk-song", "oral-tradition"]],
  ];
  for (const [email, cats] of interestMap) {
    const userId = userByEmail[email];
    if (!userId) continue;
    for (const catName of cats) {
      const categoryId = catByName[catName];
      if (categoryId) interestData.push({ userId, categoryId });
    }
  }
  await prisma.interest.createMany({ data: interestData, skipDuplicates: true });

  // ── 11. Verifications & Corrections ────────────────────────────────
  console.log("Verifications & Corrections...");
  const verData: { postId: string; userId: string; status: string; comment: string | null }[] = [
    { postId: postIds[0]!, userId: dbUsers[2]!.id, status: "VERIFIED", comment: "Matches the Madhubani sohar I recorded in 2019." },
    { postId: postIds[0]!, userId: dbUsers[4]!.id, status: "VERIFIED", comment: "Song structure is accurate." },
    { postId: postIds[0]!, userId: dbUsers[5]!.id, status: "VERIFIED", comment: "Confirmed — widely known sohar variant." },
    { postId: postIds[0]!, userId: dbUsers[1]!.id, status: "VERIFIED", comment: "Lamp imagery is consistent." },
    { postId: postIds[0]!, userId: dbUsers[3]!.id, status: "VERIFIED", comment: "Similar sohar in Rajasthan." },
    { postId: postIds[0]!, userId: dbUsers[6]!.id, status: "VERIFIED", comment: "Musical structure matches." },
    { postId: postIds[3]!, userId: dbUsers[2]!.id, status: "VERIFIED", comment: "Warli paintings well-documented." },
    { postId: postIds[3]!, userId: dbUsers[0]!.id, status: "VERIFIED", comment: "Classic Warli harvest cycle." },
    { postId: postIds[4]!, userId: dbUsers[0]!.id, status: "VERIFIED", comment: "Baul performance is authentic." },
    { postId: postIds[6]!, userId: dbUsers[7]!.id, status: "VERIFIED", comment: "Theyyam preparation accurate." },
    { postId: postIds[2]!, userId: dbUsers[2]!.id, status: "PENDING", comment: null },
    { postId: postIds[5]!, userId: dbUsers[5]!.id, status: "VERIFIED", comment: "Kalbelia well-documented." },
  ].filter(v => v.postId);
  await prisma.verification.createMany({ data: verData, skipDuplicates: true });

  const corrData: { postId: string; userId: string; field: string; suggestion: string }[] = [
    { postId: postIds[0]!, userId: dbUsers[2]!.id, field: "Translation", suggestion: "\"इजोत\" is closer to \"radiance\" than \"light\" in ritual context." },
    { postId: postIds[3]!, userId: dbUsers[2]!.id, field: "Description", suggestion: "The painting took five days, not three." },
    { postId: postIds[8]!, userId: dbUsers[0]!.id, field: "Description", suggestion: "Should mention specific songs for each vessel shape." },
  ].filter(c => c.postId);
  if (corrData.length > 0) {
    await prisma.correction.createMany({ data: corrData, skipDuplicates: true });
  }
  console.log(`  ${verData.length} verifications, ${corrData.length} corrections`);

  // ── 12. Notifications ──────────────────────────────────────────────
  console.log("Notifications...");
  const notifData = [
    { userId: demoId!, actorId: userByEmail["kamla@example.com"], type: "LIKE", message: "Kamla Devi liked your post", relatedId: postIds[0], read: false },
    { userId: demoId!, actorId: userByEmail["anwesha@example.com"], type: "COMMENT", message: "Anwesha Roy commented on your post", relatedId: postIds[0], read: false },
    { userId: demoId!, actorId: userByEmail["jivya@example.com"], type: "FOLLOW", message: "Jivya Vaghela started following you", relatedId: userByEmail["jivya@example.com"], read: true },
    { userId: demoId!, actorId: userByEmail["balan@example.com"], type: "VERIFICATION", message: "Balan Peruvannan verified your post", relatedId: postIds[0], read: false },
    { userId: demoId!, actorId: userByEmail["rukma@example.com"], type: "CORRECTION", message: "Rukma Sapera suggested a correction", relatedId: postIds[0], read: true },
    { userId: demoId!, actorId: userByEmail["sudarshan@example.com"], type: "LIKE", message: "Sudarshan Maharana liked your post", relatedId: postIds[0], read: true },
    { userId: demoId!, actorId: userByEmail["meera@example.com"], type: "COMMENT", message: "Meera Nathwani commented on your post", relatedId: postIds[0], read: true },
    { userId: demoId!, actorId: userByEmail["kamla@example.com"], type: "FOLLOW", message: "Kamla Devi started following you", relatedId: userByEmail["kamla@example.com"], read: false },
    { userId: demoId!, actorId: userByEmail["anwesha@example.com"], type: "LIKE", message: "Anwesha Roy liked your post", relatedId: postIds[4], read: true },
    { userId: demoId!, actorId: userByEmail["balan@example.com"], type: "COMMENT", message: "Balan Peruvannan commented on your post", relatedId: postIds[4], read: true },
  ].filter(n => n.actorId && n.relatedId);
  await prisma.notification.createMany({ data: notifData, skipDuplicates: true });
  console.log(`  ${notifData.length} notifications`);

  // ── 13. Interviews ──────────────────────────────────────────────────
  console.log("Interviews...");
  const kamlaId = userByEmail["kamla@example.com"];
  const jivyaId = userByEmail["jivya@example.com"];
  if (kamlaId) {
    const existing = await prisma.interview.findFirst({ where: { title: "Kamla Devi on Mithila birth songs" } });
    if (!existing) {
      const interview = await prisma.interview.create({
        data: {
          title: "Kamla Devi on Mithila birth songs",
          status: "COMPLETED",
          userId: kamlaId,
          questions: {
            create: [
              { question: "What songs did you hear at births growing up?", order: 1 },
              { question: "Who taught you the Sohar verses?", order: 2 },
              { question: "Are there different versions in different families?", order: 3 },
              { question: "What happens when there are no daughters-in-law to sing them?", order: 4 },
              { question: "How does Chhath connect to birth rituals?", order: 5 },
            ],
          },
        },
      });
      // Add responses
      const qs = await prisma.interviewQuestion.findMany({ where: { interviewId: interview.id }, orderBy: { order: "asc" } });
      for (const q of qs) {
        await prisma.interviewResponse.create({
          data: { questionId: q.id, audioUrl: `/files/interviews/${interview.id}/q${q.order}.mp3`, transcription: `Response for: ${q.question}` },
        });
      }
    }
  }
  if (jivyaId) {
    const existing = await prisma.interview.findFirst({ where: { title: "Jivya Vaghela on Warli painting traditions" } });
    if (!existing) {
      await prisma.interview.create({
        data: {
          title: "Jivya Vaghela on Warli painting traditions",
          status: "DRAFT",
          userId: jivyaId,
          questions: {
            create: [
              { question: "How did you first learn to paint?", order: 1 },
              { question: "What materials do you use and why?", order: 2 },
              { question: "Tell me about the harvest cycle painting.", order: 3 },
              { question: "How has Warli art changed over generations?", order: 4 },
            ],
          },
        },
      });
    }
  }
  console.log("  2 interviews");

  // ── 14. Processing Jobs ────────────────────────────────────────────
  console.log("Processing Jobs...");
  const jobData = postIds.slice(0, 5).map(postId => ({ postId, status: "COMPLETED" as const }));
  await prisma.processingJob.createMany({ data: jobData, skipDuplicates: true });
  // One failed job
  if (postIds[9]) {
    const existing = await prisma.processingJob.findFirst({ where: { postId: postIds[9] } });
    if (!existing) {
      await prisma.processingJob.create({ data: { postId: postIds[9], status: "FAILED", step: "TRANSCRIBING", error: "Audio format not supported" } });
    }
  }

  console.log("\nDone! Demo data seeded successfully.");
  console.log(`${dbUsers.length} users, ${postIds.length} posts, ${likeData.length} likes, ${saveData.length} saves`);
}

main()
  .catch(e => { console.error("Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
