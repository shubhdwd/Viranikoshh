---
activation: always_on
---

# VIRANIKOSH — BACKEND BRAIN
**Owner:** Krishna Singh (Backend Lead)
**Event:** SIH Internal Hackathon — B. K. Birla College, Kalyan
**Date:** 2nd September 2026, 11:00 AM – 5:00 PM
**Team:** Krishna Singh (Backend), Badal (Frontend), Mustafa (Database), Rohan (DevOps + PPT)

> This file is context for any AI coding tool (Antigravity, OpenCode.ai, Gemini, etc.)
> Paste/attach this file first, every time, on any account, so the AI instantly
> understands the project without re-explanation.

---

## 1. PROJECT GOAL (one line)

Viranikosh is a platform where people record local cultural content (songs,
stories, festivals, interviews) → AI transcribes, translates, summarizes, and
tags it → the community verifies it → it becomes searchable, map-based,
preserved cultural knowledge for future generations.

**Tagline:** *"Original Source + AI Enrichment + Community Trust"*

---

## 2. MY ROLE (Krishna Singh — Backend Lead)

I own the **entire backend**: API design, database interaction via Prisma,
authentication, file upload handling, AI-pipeline orchestration (calling AI
services, not building AI models myself), security, and error handling.

**I do NOT own:** UI (Badal), raw database schema design (Mustafa — but I
consume it via Prisma), deployment/CI-CD/PPT (Rohan).

**Boundaries with teammates:**
- Badal (Frontend) → consumes my REST APIs. I must give him clean, documented
  endpoints + example JSON responses.
- Mustafa (Database) → designs `schema.prisma` entities; I write the queries/
  business logic on top of it. We must sync on entity names/fields.
- Rohan (DevOps) → deploys what I build, needs `.env` vars and `package.json`
  scripts documented.

---

## 3. TECH STACK (backend)

- **Runtime:** Node.js + TypeScript
- **Framework:** Express (per `app.ts` in architecture doc)
- **ORM:** Prisma
- **Auth:** JWT + bcrypt password hashing
- **File storage:** Object storage (for original media)
- **AI:** Called via API from backend (speech-to-text → translation →
  summarization → tagging) — I orchestrate calls, AI logic lives in `src/ai/`

---

## 4. FOLDER STRUCTURE (from architecture doc)

```
src/
├── routes/
├── controllers/
├── validators/
├── utils/
├── ai/
└── app.ts

prisma/
└── schema.prisma

.env
package.json
tsconfig.json
```

---

## 5. FULL API LIST (what I must build)

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
```
- JWT-based auth, passwords securely hashed (bcrypt)

### Cultural Post APIs
```
POST   /api/posts
GET    /api/posts/feed
GET    /api/posts/:id
PATCH  /api/posts/:id
DELETE /api/posts/:id
GET    /api/posts/:id/related
```

### Upload APIs
```
POST   /api/uploads
GET    /api/uploads/:id/status
```
- Validate: file type, MIME type, file size, user permissions
- Original media → object storage

### Social APIs
```
POST   /api/posts/:id/like
DELETE /api/posts/:id/like
POST   /api/posts/:id/save
DELETE /api/posts/:id/save
GET    /api/posts/:id/comments
POST   /api/posts/:id/comments
POST   /api/users/:id/follow
DELETE /api/users/:id/follow
```

### Search APIs
```
GET    /api/search
GET    /api/search/suggestions
```

### Cultural Map API
```
GET    /api/cultural-map
```
Returns: `postId, title, latitude, longitude, region, category, thumbnail`

### Verification APIs
```
POST   /api/posts/:id/verify
POST   /api/posts/:id/corrections
GET    /api/posts/:id/verifications
```
- Verification is **community-driven**. AI never determines authenticity.

### Virasat Interview APIs
```
POST   /api/interviews
GET    /api/interviews/:id
POST   /api/interviews/:id/questions
POST   /api/interviews/:id/audio
POST   /api/interviews/:id/complete
```

### Notification APIs
```
GET    /api/notifications
PATCH  /api/notifications/:id/read
```
Triggers: Follow, Like, Comment, Verification, Correction

---

## 6. DATABASE ENTITIES (owned by Mustafa, I consume via Prisma)

```
User, Profile, CulturalPost, Media, Language, Region, CulturalCategory,
Tag, Comment, Like, Save, Follow, Interest, Verification, Correction,
Notification, Interview, InterviewQuestion, InterviewResponse,
Transcript, Translation, CulturalRelation, ProcessingJob
```

**Main relationships:**
- `User` → CulturalPosts, Comments, Likes, Saves, Follows, Interviews, Notifications
- `CulturalPost` → Media, Transcript, Translation, Tags, Comments, Likes,
  Saves, Verification, Corrections, CulturalRelations
- `CulturalRelation` → sourcePostId, targetPostId, relationType (RELATED_TRADITION,
  REGIONAL_VARIANT, SAME_FESTIVAL, RELATED_SONG, SAME_ART_FORM)

---

## 7. AI PIPELINE (I orchestrate, don't build the models)

```
Original Audio/Video
   ↓
Language Detection
   ↓
Speech-to-Text
   ↓
Translation
   ↓
Summarization
   ↓
Cultural Tag Extraction
   ↓
Structured Cultural Record
   ↓
Community Verification
```

**Processing states to track in DB (ProcessingJob):**
```
QUEUED → PROCESSING → TRANSCRIBING → TRANSLATING → TAGGING → COMPLETED
                                                            ↘ FAILED → Retry
```

**Rule:** AI output must NEVER overwrite original cultural material. Original
media + original transcript always preserved even if AI processing fails.

---

## 8. SECURITY CHECKLIST (backend)

- [ ] JWT authentication
- [ ] Password hashing (bcrypt)
- [ ] Role-based access control
- [ ] Input validation (all routes)
- [ ] File validation (type, extension, size, upload permissions)
- [ ] Rate limiting
- [ ] CORS configured
- [ ] Secure environment variables (`.env`, never committed)
- [ ] Ownership checks (user can only edit/delete their own data)
- [ ] Prisma parameterized queries (no raw SQL injection risk)

---

## 9. DAILY TASK PLAN (backend-focused, from 15-day roadmap)

| Days | Backend Task |
|---|---|
| 1–2 | Database schema (with Mustafa), Prisma setup, Authentication APIs, base API structure |
| 3–5 | Post APIs, User APIs, Interaction APIs (for feed/profile/social features Badal needs) |
| 6–7 | Upload APIs, storage integration, processing job creation |
| 8–9 | AI processing orchestration — trigger transcription/translation/summary/tagging, expose status |
| 10–11 | Interview APIs, cultural record generation logic |
| 12 | Verification + Corrections APIs |
| 13 | Search APIs, Cultural Map API |
| 14 | Full integration with frontend, error handling, security pass, testing |
| 15 | Demo data seeding, bug fixing, performance pass, final testing |

---

## 10. RULES FOR THE AI ASSISTANT (Antigravity / OpenCode / Gemini)

1. Always write backend code in **TypeScript + Express + Prisma**.
2. Follow the folder structure in Section 4 exactly.
3. Every new API must match the route list in Section 5 — don't invent
   different route names.
4. Every endpoint needs: input validation, ownership/auth checks, and a
   consistent JSON response shape.
5. Never let AI-generated content overwrite original user-submitted content.
6. Ask me before changing database schema — that's Mustafa's territory, I
   just consume it.
7. Keep responses practical and code-first — I'm a student on a hackathon
   deadline, not looking for long theory lectures.

---

*Last updated: for SIH internal round, 2nd Sept 2026. Update this file as
scope/roles change.*
