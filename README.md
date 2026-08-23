# Viranikosh — Cultural Heritage Preservation Platform

> Community-driven platform to record, enrich, and verify India's living cultural heritage.
> Original Source + AI Enrichment + Community Trust.
> Last updated: 20-Aug-2026 (verified state).

---

## 1. What is Viranikosh?

Viranikosh (meaning *"your heritage / your story"*) is a community-driven
platform to **preserve India's intangible cultural heritage**. People upload
original cultural media — folk songs, oral stories, rituals, crafts, festivals,
interviews with knowledge-holders — and the platform uses AI to make that
content searchable and accessible, while the **community verifies** accuracy.

**Design principle:** *Original Source + AI Enrichment + Community Trust.*
AI never edits the original; it only adds machine-generated metadata. Humans
decide what is true.

---

## 2. Problem & Vision (SIH context)

India has thousands of living traditions passed down orally, many at risk of
being lost as elders pass and dialects fade. Existing archives are fragmented,
language-bound, and hard to search. Viranikosh makes grassroots cultural records:

- **Discoverable** via translation, tagging, and full-text search.
- **Trustworthy** via community verification and corrections.
- **Map-able** via geographic and cultural-relation linking.
- **Accessible** in multiple Indian languages.

---

## 3. Core Features (mapped to build days)

| Day | Feature | What it does |
|-----|---------|--------------|
| 1–2 | Auth & Schema | JWT registration/login, bcrypt hashing, Prisma schema, roles (USER/ADMIN), token-revocation (`tokenVersion`) |
| 3–5 | Posts, Users, Interactions | Create/list cultural records; profiles; like, save, comment, follow with ownership + count tracking |
| 6–7 | Upload & Storage | Multipart media upload (audio/video/image/doc), Cloudinary with local-disk fallback, processing-job creation |
| 8–9 | AI Pipeline | Async orchestration: transcribe → translate → summarize → tag; provider fallback |
| 10–11 | Virasat Interviews | Structured interview sessions with questions + recorded audio responses |
| 12 | Verification & Corrections | Community verify/flag a post, suggest corrections; self-verify blocked |
| 13 | Search & Cultural Map | Full-text search, autocomplete suggestions, geo map of records |
| 14 | Security, Notifications, Integration | Rate limiting, CORS, helmet, actor-aware notifications, related-records graph, interests/taxonomy |

---

## 4. Tech Stack

### Backend
- **Node.js + TypeScript** (dev via `tsx`)
- **Express 5** REST API
- **Prisma 5** ORM → **PostgreSQL** (Supabase)
- **Auth:** `jsonwebtoken` + `bcryptjs`, `tokenVersion` revocation
- **Validation:** Zod 4
- **Uploads:** `multer` + Cloudinary (local fallback)
- **Security:** `helmet`, `cors` (env origins), `express-rate-limit` (general / auth / strict tiers), per-route ownership checks

### AI Pipeline (`src/ai/`)
| Stage | Primary | Fallback |
|-------|---------|----------|
| Transcription (audio/video) | Groq Whisper `whisper-large-v3` | — |
| Translation | Gemini **3.6 Flash** | Groq `openai/gpt-oss-120b` |
| Tag / category / region extraction | Gemini **3.6 Flash** | Groq `openai/gpt-oss-120b` |
| Language detection | Gemini **3.6 Flash** | Groq `openai/gpt-oss-120b` |
| Summarization | Cohere `command-a-03-2025` | skipped silently if unset |

Provider abstraction in `src/ai/providers.ts` (`withFallback`, `checkProviders`).
`GET /api/health` reports live provider availability.

### Frontend
- **React 18 + TypeScript**, **Vite 5**
- **react-router-dom 6**, **Tailwind CSS 3**, **Leaflet/react-leaflet** (maps)
- **axios** (`apiClient` unwraps `{success,data,message}`; 401 → `/login`)
- **framer-motion**, **lucide-react**
- **Playwright** E2E suite (23 tests)

---

## 5. Architecture & Data Flow

```
Contributor ──upload──▶ Frontend (React/Vite)
                            │  POST /api/uploads (multipart)
                            ▼
                       Backend (Express)
                            │  stores Media + creates ProcessingJob
                            │  startPipeline()  [fire-and-forget]
                            ▼
                   AI Pipeline (Groq → Gemini → Cohere)
                            │  writes Transcript / Translation / TagOnPost
                            ▼
                       PostgreSQL (Supabase)
                            │
Community ──verify/correct──▶ Backend ──▶ trust status + notifications
Search/Map ──▶ Backend ──▶ indexed, geo-tagged, related records
```

---

## 6. API Surface (key endpoints)

- **Auth:** `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- **Posts:** `POST /posts`, `GET /posts/feed`, `GET /posts/:id`, `PATCH /posts/:id`, `DELETE /posts/:id`, `GET /posts/:id/related`, `POST /posts/:id/relations`
- **Social:** `POST/DELETE /posts/:id/like`, `/save`; `GET/POST /posts/:id/comments`; `POST/DELETE /users/:id/follow`
- **Upload + AI:** `POST /uploads`, `GET /uploads/:id/status`
- **Verification:** `POST /posts/:id/verify`, `POST /posts/:id/corrections`, `GET /posts/:id/verifications`, `GET /verification/queue`, `GET /verification/flagged`
- **Interviews:** `POST /interviews`, `GET /interviews/:id`, `POST /interviews/:id/questions`, `POST /interviews/:id/audio`, `POST /interviews/:id/complete`
- **Search / Map:** `GET /search`, `GET /search/suggestions`, `GET /cultural-map`
- **Notifications:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- **Taxonomy / Interests:** `GET /taxonomy`, `POST/DELETE /interests/:categoryId/follow`, `GET /users/me/interests`, `GET /users/suggested`
- **Health:** `GET /health` (includes AI provider status)

### Response envelope
All endpoints return:
```json
{ "success": true, "message": "...", "data": { ... } }
```
`data` is unwrapped by the frontend `apiClient`.

---

## 7. Database Schema (Prisma / PostgreSQL)

`User`, `Profile`, `CulturalPost`, `Media`, `Language`, `Region`,
`CulturalCategory`, `Tag`, `TagOnPost`, `Comment`, `Like`, `Save`, `Follow`,
`Interest`, `Verification`, `Correction`, `Notification`, `Interview`,
`InterviewQuestion`, `InterviewResponse`, `Transcript`, `Translation`,
`CulturalRelation`, `ProcessingJob`.

---

## 8. How to Run

### Backend
```bash
cd backend
cp .env.example .env        # fill DATABASE_URL, GEMINI/GROQ/COHERE/CLOUDINARY keys
npm install
npx prisma generate
npx prisma db push          # or migrate
npm run dev                 # tsx watch src/server.ts → http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # Vite → http://localhost:5173
```

### Tests
```bash
# Backend endpoint E2E (custom script against running server)
node e2e-verify.mjs

# Frontend E2E (Playwright boots its own backend w/ mock AI + higher limits)
npx playwright test
```

---

## 9. Testing & Verification (current status)

| Check | Result |
|-------|--------|
| Backend Day 1–14 endpoints (E2E) | **47 / 47 passing** |
| Frontend `tsc --noEmit` | **0 errors** |
| Frontend `vite build` | ✅ success |
| Frontend Playwright E2E | **23 / 23 passing** |
| Live AI providers (`/health`) | Gemini ✅, Groq ✅, Cohere ✅ |
| Backend `tsc --noEmit` | **0 errors** |

### Bug fixes applied
- `verificationApi.submit` now sends correct `{status, comment}` (verify) and `{field, suggestion}` (correction) payloads — previously 400'd.
- `notificationApi.list` now uses the backend `actor` object so notifications show the correct person.

---

## 10. Project Structure

```
SIH BACKEND/
├── backend/
│   ├── src/
│   │   ├── ai/            # pipeline, translation, tagging, transcription, providers
│   │   ├── controllers/   # auth, post, social, upload, interview, verification, ...
│   │   ├── middleware/    # auth, rate-limit, upload
│   │   ├── routes/        # Express routers
│   │   ├── validators/    # Zod schemas
│   │   ├── utils/         # prisma, jwt, apiResponse
│   │   ├── scripts/       # cleanup utilities
│   │   ├── app.ts, server.ts
│   │   └── prisma/schema.prisma
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/           # typed API clients
│   │   ├── components/    # UI + feature components
│   │   ├── pages/         # routes
│   │   ├── contexts/      # Auth, Interactions
│   │   ├── data/          # static/mock fallbacks
│   │   └── types/
│   └── tests/             # Playwright E2E
├── PROJECT_LOG.md
├── README.md              # this file
└── TECHSTACK.md
```

---

## 11. Security

- `.env` (API keys, DB URL) is environment-provided and **not** in source control by default.
- JWT with `tokenVersion` revocation; 401 interceptor on the frontend.
- Tiered rate limiting (general / auth / strict) per IP.
- Ownership checks on every mutating route (edit/delete/verify-self blocked).
- `helmet` + env-driven CORS.
- Media served via `/files/*` with owner/admin gating; drafts private.

---

## 12. Incomplete / Known Gaps

The platform is functional end-to-end, but the following are **not yet complete**:

- **Admin UI:** The `POST /users/:id/promote` (admin role promotion) endpoint exists,
  but there is no admin UI to use it. Admins must be promoted via API/DB.
- **Real-time notifications:** Notifications are pull-based (polling). No WebSocket /
  push channel yet.
- **Verification actions `context` & `flag`:** The frontend offers these, but there is
  **no backend endpoint** for them — they are stored only as local optimistic UI state
  and are lost on refresh. Only `verify` and `correct` persist server-side.
- **Feed / search pagination in UI:** The API supports `page`/`limit`, but the frontend
  does not yet implement infinite scroll or "load more".
- **Image / document AI:** For non-audio uploads, tagging/summary uses the post's text
  content only (no OCR / vision model). Cohere summarization only runs when a post has
  no description and the transcript is > 50 chars.
- **Committed test suite:** There is no backend unit/integration suite in the repo —
  verification used an ad-hoc `e2e-verify.mjs` script and the Playwright suite (which
  mocks the AI providers). No CI/CD pipeline is configured.
- **Deployment:** No Dockerfile, no production/deploy config, no environment segregation.
- **i18n / accessibility:** UI is primarily English; full multi-language UI and a11y
  pass are pending.
- **Knowledge graph & related-records UI:** The relation API exists, but the graph
  visualization and "related records" surfaces in the UI are minimal.
- **Auth rate limit:** The strict 10/min auth limiter can be too low during automated
  E2E runs (Playwright raises it via env when it owns the server).

---

## 13. Status & Next Steps

**Done:** Full backend (Day 1–14), frontend with E2E coverage, AI provider
fallback system, community verification, search/map, notifications, interviews.

**Next:** admin moderation console, real-time notifications, persist `context`/`flag`
verification server-side, pagination in UI, vision/OCR for images, CI/CD, and a
deployment setup.
