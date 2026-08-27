# DONE — Viranikosh Category Fix (27-Aug-2026)

> Is doc ka maqsad: aaj kaise category-related bugs found kiye aur solve kiye,
> taaki aage koi aisa bug aaye to yahan dekh kar turant root cause + fix samajh aaye.
> **Koi post delete nahi hua, koi user follow nahi khoya.**

---

## 1. Problem summary (kya problem tha)

1. **Home page "Cultural interests"** (Folk songs, Oral storytelling, Tribal art, ...)
   select karne par bhi **saare 107 posts mixed** dikh jaate the — category filter
   kaam nahi kar raha tha.

2. **Duplicate/old categories** thi DB mein: `Folk Song`, `Craft`, `Dance`, `Ritual`
   (display-style names) proper lowercase seed categories (`folk-song`, `craft`, ...)
   ke saath conflict kar rahi thi.

3. **17 published posts uncategorized** the (`categoryId = null`) — feed mein bina
   category ke aate the.

4. **Kai "Smoke Test / Related Record / Owner Post" test posts** the jo E2E testing
   ke byproducts the.

---

## 2. How to check category counts (repro steps)

> Read-only recheck ke liye. Run in `backend/`:
> `npx tsx -e "..."` ya ek temp script bana kar, ya seed-categories.ts ka
> category-count block reuse karo.

Sabse easy: category-wise published count dekho:
```ts
// backend/src/scripts/ (temp) — run: npx tsx src/scripts/check.ts
import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const cats = await prisma.culturalCategory.findMany({ select: { id: true, name: true } });
  const counts = await prisma.culturalPost.groupBy({ by: ["categoryId"], _count: { id: true }, where: { published: true } });
  const catById = Object.fromEntries(cats.map(c => [c.id, c.name]));
  for (const g of counts) console.log(catById[g.categoryId] ?? "uncategorized", "=", g._count.id);
  await prisma.$disconnect();
})();
```

**API se live verify:**
```
GET http://localhost:5000/api/posts/feed?followedInterests=folk-song&limit=50
  → pehle: posts=50, total=107, cats=MIXED sab
  → fix ke baad: posts=19, total=19, cats=folk-song (sirf usi category)
```

---

## 3. Root cause #1 — Backfill bug (main bug)

**File:** `backend/src/controllers/post.controller.ts` → `getFeed()`

**Kya tha:** jab `followedInterests` se category filter lagta tha, aur filtered results
`limit` se kam hote the, to ek "backfill" block tha jo **baaki SAARE published posts**
bina category filter ke add kar deta tha:

```js
// ❌ PURANA (buggy)
if (categoryIds && posts.length < limit) {
  const extra = await prisma.culturalPost.findMany({
    where: { published: true, id: { notIn: excludeIds } }, // ← category filter IGNORED
    ...
  });
  posts = [...posts, ...extra];
  total = await prisma.culturalPost.count({ where: { published: true } }); // total bhi sab ka
}
```

Isliye kisi bhi category ke liye feed mein sab kuch (mixed) dikhta tha.

**Fix:** backfill ko bhi `where` (jo category filter rakhta hai) ke andar rakha aur
sirf **first page** (`page === 1`) par apply kiya, taaki pagination pe duplicate na aaye:

```js
// ✅ NAYA (fixed)
if (categoryIds && page === 1 && posts.length < limit) {
  const needed = limit - posts.length;
  const excludeIds = posts.map((p) => p.id);
  const extra = await prisma.culturalPost.findMany({
    where: { ...where, id: { notIn: excludeIds } }, // ← same filter respected
    ...
  });
  posts = [...posts, ...extra];
  total = await prisma.culturalPost.count({ where });
}
```

**Key learning (aage ke liye):**
- Backfill karte waqt **hamesha original `where` reuse karo**, `{ published: true }` fresh
  mat banao — warna filter bypass ho jata hai.
- Pagination-aware banao: backfill sirf `page === 1` par, warna `skip` ko over-ride
  kar ke previous page ke items duplicate dikhte hain.
- `total` bhi wahi `where` se count karo jo posts ke saath use hua, taaki total & posts
  consistent rahein.

**Important mapping (2 jagah same rakhi hai, change karte waqt dono update karo):**
- Backend: `INTEREST_DISPLAY_TO_CATEGORY` in `post.controller.ts`
- Frontend: `INTEREST_NAME_TO_ID` in `frontend/src/types/culture.ts`

Agar ek jagah change karo aur doosri nahi, to display name → slug mapping mismatch ho
jayega. (Note: `Pottery & clay` / `Instrument making` → `craft`, aur `Regional cuisine
lore` → `traditional-practice` yeh intentionally **same** slug pe map hote hain; isi liye
wo categories ke posts same honge — future me alag chahiye to naya slug + DB category
banani hogi.)

---

## 4. Root cause #2 — Duplicate / old categories

**DB mein mili thi:**
| Old category | Posts | Proper target |
|---|---|---|
| `Craft` | 2 | `craft` |
| `Folk Song` | 1 | `folk-song` |
| `Dance` | 0 | — (delete) |
| `Ritual` | 0 | — (delete) |

**Solution (merge, delete nahi):**
1. Posts ko proper category mein move kiya: `Folk Song`→`folk-song`, `Craft`→`craft`.
2. User `Interest` records ko proper category mein **remap** kiya (`whoare1307@gmail.com`
   ka `Folk Song` follow ab `folk-song` par hai) — taaki koi user ka follow na khoye.
   - Agar user ke paas doosri proper category ka follow pehle se tha to duplicate `Interest`
     delete kiya (avoid unique constraint `[userId, categoryId]`).
3. 4 empty old categories delete ki.

**Script approach (transaction):**
```ts
// interactive transaction timeout badhao → remote Supabase slow hai
await prisma.$transaction(async (tx) => {
  // 1) posts.updateMany({ where:{categoryId:dupId}, data:{categoryId:targetId} })
  // 2) interest remap: update ya delete (collision check)
  // 3) category.delete({ where:{id:dupId} })
}, { timeout: 60000, maxWait: 60000 });
```

**⚠️ Aage ke liye gotcha:** `prisma.$transaction` default timeout ~5s hota hai. Is remote
Supabase database par chhota transaction bhi timeout karke `P2028 "Transaction not found"`
de deta hai. **Hamesha `{ timeout: 60000 }` pass karo.**

---

## 5. Root cause #3 — 17 uncategorized posts

**Kya the:**
- 7 `Smoke Test Tradition ...` (tags: `folk-song`) → `folk-song`
- 1 `krishna — t4` (audio interview, tags: `oral-traditions`) → `oral-tradition`
- 9 generic (`Related Record ...` x6, `Owner Post`, `Test Post For Verify`, `Fix Post`) → `folk-story`

**Fix:** `culturalPost.update({ data: { categoryId } })` karke proper category set ki.
Ye delete nahi, sirf assignment tha.

**Learning:** E2E/test posts (Smoke Test, Related Record, Owner Post, Fix Post, etc.)
uncategorized reh jaate hain. Agar future me koi naya test content bane to ya to usi me
category set karo, ya yeh accepted ki test data categories me jayega.

---

## 6. Final verified state (after fix)

```
Published uncategorized = 0
Total published        = 107   (intact, koi post delete nahi)

folk-story: 20
folk-song : 19
craft     : 13
traditional-practice: 13
oral-tradition: 11
artwork   : 11
local-history: 11
festival  : 9
```

Sirf **8 proper categories** rah gayi (duplicates hata diye).

---

## 7. Verifications done

| Check | Result |
|---|---|
| `?followedInterests=folk-song` | 19 posts, sirf folk-song ✓ |
| `?followedInterests=craft` | 13, sirf craft ✓ |
| `?followedInterests=folk-story` | 20, sirf folk-story ✓ |
| `?followedInterests=festival` | 9, sirf festival ✓ |
| combo `folk-song,craft,festival` | 41 (19+13+9) ✓ |
| no filter | total 107 ✓ |
| `page=2&limit=19` folk-song | 0 posts (ab duplicate nahi) ✓ |
| `rs tsc --noEmit` (backend) | sirf pre-existing errors (check-categories.ts, seed-categories.ts) |
| `rs tsc --noEmit` (frontend) | sirf pre-existing (`lucide-react` types, unused import) |

**Typecheck note:** `backend/src/scripts/check-categories.ts`, `seed-categories.ts`,
`check-regions.ts`, `cleanup-duplicate-regions.ts` — yeh untracked scripts hain (user ke
local) jinme pre-existing TS errors hain. Inse koi darr nahi, main code clean hai.

---

## 8. Files/changes is session (reference)

- **Modified:** `backend/src/controllers/post.controller.ts` (backfill bug fix)
- **DB changes (scripts — temp, delete kar diye):**
  - uncategorized → category assignment (17 posts)
  - duplicate category merge (3 posts + 3 interests + 4 categories)
- **Temp scripts aaj banaye aur delete kiya:** `_tmp_count.ts`, `_tmp_uncat.ts`,
  `_tmp_dupcheck.ts`, `_tmp_assign.ts`, `_tmp_merge.ts`, `_tmp_verify.ts`
- **Note:** Bahut si files (`interest.controller.ts`, `postsApi.ts`, `DiscoveryRail.tsx`,
  `culture.ts`, etc.) pehle se git working-tree me modified thi (previous kaam) — is
  session maine **sirf** `post.controller.ts` ka backfill block change kiya.

---

## 9. Playwright note

- Playwright v1.62.1 installed (`frontend/`), `npx playwright --version` kaam karta hai.
- Config: `frontend/playwright.config.ts` uses `reuseExistingServer: true` → port 5173
  (frontend) aur 5000 (backend) pehle se chalu ho to reuse karta hai.
- Mock AI server port 3099 hota hai (global-setup.ts). Backend AI calls ke liye chahiye
  hota hai, lekin category/feed verify ke liye nahi.
- Category/feed verify s**idha API se kar sakte ho bina UI ke:
  `Invoke-RestMethod http://localhost:5000/api/posts/feed?followedInterests=...`
- Home page logged-out pe hero landing hota hai ("Viranikosh Record the voice..."),
  "Cultural interests" chips logged-in state / desktop DiscoveryRail me dikhte hain.
  UI se verify karna ho to pehle login karna padega.

---

## 10. Explore page — category/region filter fix (full report)

**Files changed:**
- `backend/src/controllers/search.controller.ts` → `parseStringArray()` + name-based lookup
- `frontend/src/api/client.ts` → axios `paramsSerializer`

**Problem:** Explore page (`/explore`) par kisi bhi category/region select karne par
**saare 107 posts** dikh jaate the — filter silently ignore ho jata tha. Sirf pura loot
(mixed) milta tha, koi matching selection kaam nahi karta tha.

**Repro (pehle):**
```
GET /api/search?categories=folk-song&limit=10
  → total = 107  (❌ 19 hona chahiye tha)
GET /api/search?categories=folk-song&categories=craft&limit=10
  → total = 107  (❌ 32 hona chahiye tha)
```

### Root cause (2 parts, dono mil kar ye bug banaate the)

1. **Frontend — axios array serialization:** axios default array params ko
   `categories[]=folk-song&categories[]=craft` bhejta hai (bracket suffix).
2. **Backend — Express default "simple" query parser:** Express ka default parser
   (`querystring`) bracket keys ko literally le leta hai — `req.query` me key `categories[]`
   ban jaati hai, `req.query.categories` = **undefined**. Filter ka `if (categoryNames.length)`
   block sidha skip → bacha sirf `{ published: true }` → **107**.

Toh frontend filter "lagata" tha, backend usse kabhi dekhta hi nahi tha.

### Fix

**Backend (`search.controller.ts`)** — robust `parseStringArray()` jo 3 cases handle kare
(true array, object/bracket garbage, scalar string):

```ts
function parseStringArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean).map(String);

  // simple parser ke bracket-garbage: { "": "folk-song", "": "craft" }
  if (typeof val === "object") {
    const flat = Object.values(val as Record<string, unknown>)
      .flatMap((v) => (Array.isArray(v) ? v : [v])).filter(Boolean).map(String);
    if (flat.length) return flat;
  }

  const s = String(val).trim();
  return s ? [s] : [];
}
```
Iske baad category/region names ko `prisma.culturalCategory.findMany({ name: { in } })` se
IDs resolve karke `where.categoryId = { in: [...] }` lagaya.

**Frontend (`client.ts`)** — axios instance par `paramsSerializer` jo arrays ko **simple
repeat-keys** format me bheje (bina `[]` bracket):

```ts
function paramsSerializer(params: Record<string, any>): string {
  // Arrays → categories=a&categories=b   (bracket NIKALA)
  // So backend ko req.query.categories proper array milta hai
}
```

Ab dono sides agreed format me baat karte hain: `categories=folk-song&categories=craft`,
and Express simple parser `categories` ko ek real array bana deta hai. ✓

### Verification (end-to-end, Playwright UI test)

Test flow: throwaway user register → UI login → SPA se `/explore` → chip click.

| Step | Result |
|---|---|
| Register + login (UI) | `/explore` khula (auth guard pass) ✓ |
| Baseline (no filter) | **107 cultural records** ✓ |
| "Folk Song" chip | **19** records, saare cards "Folk Song" ✓ |
| Region "Mithila, Bihar" | **9** records, saare cards "Mithila, Bihar ·" ✓ |
| Verdict | **PASS** ✓ |

**API-level (backing numbers):** `folk-song`=19, `craft`=13, `folk-song+craft`=32,
`regions=Mithila, Bihar`=9, no filter=107.

**Typecheck:** `npx tsc --noEmit` —
- `client.ts` (paramsSerializer): **0 errors**
- `search.controller.ts` (parseStringArray): **0 errors**
- Baaki errors pre-existing the (`lucide-react` types, `postsApi.ts` unused import,
  untracked temp scripts) — is fix se koi NAYA error nahi.

### Debugging journey (aage ke liye reference)

1. **Pehli Playwright test FAIL** — `/explore` **auth-guarded hai** (`RequireAuth` in
   `App.tsx`), bina login `/login` pe redirect → page load hi nahi hua. Fix: test me
   pehle UI login karo, phir SPA nav link se `/explore` jao (page.goto full reload ke baad
   auth state nahi bachta — SPA click use karo).
2. **Test hang** — "All categories" button kabhi mila hi nahi. Actual app ka reset chip
   **"All categorys"** hai (`All ${label.toLowerCase()}s` → `category`+`s`, pre-existing
   typo). Selector wahi label use karna padega jo UI dikhata hai.

**Temporary artifacts** (`frontend/tests/explore-filter.spec.ts`,
`explore-filter-report.json`, `explore-folk-song.png`, `explore-region-mithila.png`)
verify ke **baad delete** kar diye. Koi test user bacha nahi (cleanup), **107 posts intact**.

### 10.1 Baaki quick-browse facets bhi fix — Art form, Festival, Language (+ sidebar filters)

**Problem (user report):** Explore ke quick-browse chips "Art form", "Festival", "Language"
(plus `SearchFilters` sidebar ke `Tradition`, `Media`, `Verification`) koi filter nahi lagate —
kisi bhi chip pe **107 records** return hote the. `Region` tab sach me pehle se kaam karta tha
(live verify: `Mithila, Bihar` → 9).

**Root cause:** `search.controller.ts` sirf `categories` aur `regions` query params padhta
tha. `artForms`, `festivals`, `languages`, `traditions`, `tags`, `mediaTypes`, `verification`
— sab **silently ignore** hote the → hamesha full `findMany({ published: true })`.

**Data-model reality (important):** `cultural_posts` me `artForm`/`festival`/`language` direc
columns NAHI hain. Facet values taxonomy display labels hain ("Warli painting", "Chhath",
"Maithili") jabki DB me sirf:
- `category` (cultural_categories) aur `region` (regions) — relational ✓
- **tags** (`warli`, `chhath`, `maithili`, `baul`...) — lowercase fragments
- `media.type` — inconsistent casing (`audio`/`AUDIO`/`Audio`)
- `transcript.language` (sirf 12 transcripts: Maithili/Bengali/Hindi/English)
- `verification` + `correction` tables

**Fix (backend only, `search.controller.ts`):**
1. `tagClauses(values)` — har label ko lowercase tokens me todta hai (`/[a-z0-9]{3,}/g`) aur
   `tags.some.tag.name { contains, mode: insensitive }` clauses banata hai. "Warli painting"
   → `warli` OR `painting` tag match.
2. Grouped facets **OR-within-group, AND-across-groups** — har facet apna `OR` block banata
   hai, sab `where.AND` me push hote hain (`q` text search bhi ab AND me). Category/Region
   waise hi top-level relational filters.
3. `languages` → tag match **OR** `transcripts.some.language.name in [...]`.
4. `mediaTypes` → `media.some.type { equals, mode: "insensitive" }` (casing issue solved).
5. `verification` → VERIFIED rows / FLAGGED rows / correction rows; `pending` = NOT kisi bhi
   community action.
6. `pickArray(req, key)` — repeat-key (`X=a&X=b`) **aur** bracket-style legacy (`X[]=a`)
   dono parse karta hai (Express simple querystring parser literal `X[]` key banata hai).

**Verification — live API (port 5000), expected counts match:**

| Param | Before | After |
|---|---|---|
| (no filter) | 107 | 107 |
| `regions=Mithila, Bihar` | 9 | 9 |
| `artForms=Warli painting` | 107 | **4** |
| `artForms=Mithila painting` | 107 | **5** |
| `artForms=Warli+Mithila (OR)` | — | **6** |
| `festivals=Chhath` | 107 | **1** |
| `languages=Maithili` | 107 | **5** |
| `traditions=Warli wall painting` | 107 | **4** |
| `tags=warli` | 107 | **3** |
| `mediaTypes=audio` | 107 | **7** |
| `verification=verified` | 107 | **14** |

Cross-facet AND bhi check kiya (artForm+region=0, category+region=2, language+region=5,
mediaType+category=1, q+category=2). `pickArray` se bracket-style `[]` params bhi ab kaam
karte hain.

**E2E (permanent spec `frontend/tests/explore-facets.spec.ts`)** — PASS (38s): login →
SPA-nav `/explore` → baseline 107 → Folk Song=19 → Warli painting=4 → Chhath=1 →
Maithili=5 → Mithila, Bihar=9 → cards render.

**Typecheck:** `search.controller.ts` 0 errors; frontend sirf pre-existing `lucide-react`
TS7016 + `postsApi.ts` unused import (koi NAYA error nahi). Temp diagnostic script
`_tmp_facet_check.ts` deleted. Test user cleanup OK, **107 posts intact**.

---

## 11. Future improvements (agar karna ho)

1. **Duplicate interest mapping fix (frontend + backend + DB):**
   `Pottery & clay` aur `Regional cuisine lore` ko abhi `craft` / `traditional-practice`
   hi milta hai (same posts). Agar alag chahiye → naya category slug + DB category + dono
   mapping update.
2. **`folk-story` (20 posts) kisi bhi home-page interest chip se directly reachable
   nahi** — home page "Cultural interests" me `Folk stories` chip nahi hai. Agar chahiye
   to `INTERESTS` array (`frontend/src/data/taxonomy.ts`) me add karo + dono mapping.
3. **Test/smoke posts (Smoke Test Tradition, Related Record, etc.)** — decide karo kya
   inhe real feed me rehna chahiye ya alag manage karna chahiye.
4. **`lucide-react` types error** — `npm i --save-dev @types/lucide-react` se fix hoga
   (pre-existing, is session chhoda).
