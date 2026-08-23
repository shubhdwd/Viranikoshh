# Viranikosh — Tech Stack & Architecture

> Final tech stack reference. Generated 20-Aug-2026 after full verification
> (Backend Day 1–14 E2E 47/47, Frontend Playwright 23/23, live AI providers).

## 1. Overview
Viranikosh is a cultural-heritage preservation platform. Contributors upload
original cultural media (audio / video / image / document). An AI pipeline
**transcribes → translates → summarizes → tags** the content, and the
community **verifies** it. The result is a searchable, map-based, trusted
repository of cultural knowledge.

Tagline: *"Original Source + AI Enrichment + Community Trust"*

## 2. Repository Layout (monorepo)
```
SIH BACKEND/
├── backend/        # Node.js + TypeScript REST API + AI pipeline
├── frontend/       # React 18 + Vite SPA
├── PROJECT_LOG.md  # human-readable project log
└── TECHSTACK.md    # this file
```

## 3. Backend
| Concern        | Technology |
|----------------|------------|
| Runtime        | Node.js + TypeScript (`tsx` dev runner) |
| Framework      | Express 5 |
| ORM / DB       | Prisma 5 → PostgreSQL (Supabase) |
| Auth           | JWT (`jsonwebtoken`) + `bcryptjs`; `tokenVersion` revocation; roles `USER`/`ADMIN` |
| Validation     | Zod 4 |
| File upload    | `multer` (multipart) + local disk storage |
| File storage   | Cloudinary (automatic local-disk fallback on failure) |
| Security       | `helmet`, `cors` (env-driven origins), `express-rate-limit` (tiered: general / auth / strict), ownership checks on all write routes |
| Media access   | `/files/*` served with owner/admin gating; drafts private |

### AI Pipeline (`src/ai/`)
Async, fire-and-forget per upload. Orchestrated in `pipeline.ts`; provider
abstraction in `providers.ts` (`withFallback`, `checkProviders`).

| Stage | Primary | Fallback |
|-------|---------|----------|
| Transcription (audio/video) | Groq Whisper `whisper-large-v3` | — |
| Translation | Gemini **3.6 Flash** | Groq `openai/gpt-oss-120b` |
| Tag / category / region extraction | Gemini **3.6 Flash** | Groq `openai/gpt-oss-120b` |
| Language detection | Gemini **3.6 Flash** | Groq `openai/gpt-oss-120b` |
| Summarization | Cohere `command-a-03-2025` | skipped silently if key unset |

Pipeline states: `QUEUED → PROCESSING → TRANSCRIBING → TRANSLATING → TAGGING (incl. Cohere summary) → COMPLETED / FAILED`.
Results persisted to: `Transcript`, `Translation`, `TagOnPost`, `CulturalRelation`, `ProcessingJob`.

`GET /api/health` returns live provider availability (`gemini` / `groq` / `cohere`).

## 4. Database (PostgreSQL / Supabase)
Prisma models: `User`, `Profile`, `CulturalPost`, `Media`, `Language`,
`Region`, `CulturalCategory`, `Tag`, `TagOnPost`, `Comment`, `Like`, `Save`,
`Follow`, `Interest`, `Verification`, `Correction`, `Notification`,
`Interview`, `InterviewQuestion`, `InterviewResponse`, `Transcript`,
`Translation`, `CulturalRelation`, `ProcessingJob`.

## 5. Frontend
| Concern     | Technology |
|-------------|------------|
| UI          | React 18 + TypeScript |
| Build       | Vite 5 |
| Routing     | `react-router-dom` 6 |
| Styling     | Tailwind CSS 3 + `tailwind-merge` |
| Maps        | Leaflet + `react-leaflet` |
| HTTP client | `axios` (`apiClient` unwraps `{success,data,message}`, 401 → redirect `/login`) |
| Animation   | `framer-motion` |
| Icons       | `lucide-react` |
| E2E tests   | Playwright (23 tests, passing) |

State: `AuthContext`, `InteractionsContext`; API layer in `src/api/*`;
components in `src/components/*`; pages in `src/pages/*`.

## 6. API Surface (key endpoints)
- **Auth:** `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- **Posts:** `POST /posts`, `GET /posts/feed`, `GET /posts/:id`, `PATCH /posts/:id`, `DELETE /posts/:id`, `GET /posts/:id/related`, `POST /posts/:id/relations`
- **Social:** `POST/DELETE /posts/:id/like`, `/save`; `GET/POST /posts/:id/comments`; `POST/DELETE /users/:id/follow`
- **Upload + AI:** `POST /uploads` (multipart), `GET /uploads/:id/status`
- **Verification:** `POST /posts/:id/verify`, `POST /posts/:id/corrections`, `GET /posts/:id/verifications`, `GET /verification/queue`, `GET /verification/flagged`
- **Interviews:** `POST /interviews`, `GET /interviews/:id`, `POST /interviews/:id/questions`, `POST /interviews/:id/audio`, `POST /interviews/:id/complete`
- **Search / Map:** `GET /search`, `GET /search/suggestions`, `GET /cultural-map`
- **Notifications:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- **Taxonomy / Interests:** `GET /taxonomy`, `POST/DELETE /interests/:categoryId/follow`, `GET /users/me/interests`, `GET /users/suggested`
- **Health:** `GET /health` (incl. AI provider status)

## 7. Verification Status (as of 20-Aug-2026)
- Backend Day 1–14 endpoints: **47/47 E2E passing**
- Frontend: `tsc --noEmit` 0 errors, `vite build` OK, Playwright **23/23**
- Live AI providers: Gemini, Groq, Cohere all `available: true`
- Bug fixes applied this session:
  - `verificationApi.submit` now sends correct `{status, comment}` / `{field, suggestion}` payloads
  - `notificationApi.list` now uses the backend `actor` object (correct person shown)

## 8. Security Notes
- `.env` files are **not** part of source commits in this push (kept local).
  API keys (Gemini, Groq, Cohere, Cloudinary) and the DB URL live in `.env`.
- Rate limiting, CORS, helmet, ownership checks, and JWT revocation are enabled.
