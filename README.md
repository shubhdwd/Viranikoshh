<div align="center">

# 🏛️ Viranikosh

### *"Your Heritage, Your Story"*

A community-driven platform to **preserve India's intangible cultural heritage** — folk songs, oral histories, rituals, crafts, festivals, and interviews with knowledge-holders. Contributors upload original cultural media. An AI pipeline transcribes, translates, summarizes, and tags the content. The community verifies its accuracy.

**Original Source + AI Enrichment + Community Trust**

---

![CI](https://github.com/stds9308Rohan/Viranikosh/actions/workflows/ci.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)
![License](https://img.shields.io/badge/License-MIT-green)

[Live Demo](#-quick-start) • [Features](#-features) • [Architecture](#-architecture) • [API Reference](#-api-reference) • [Getting Started](#-getting-started)

</div>

---

## ✨ Features

### 🤖 AI-Powered Cultural Intelligence
| Feature | Provider | Fallback |
|---------|----------|----------|
| **Transcription** — Audio/video → text with language detection (23 Indian languages) | Groq Whisper `whisper-large-v3` | — |
| **Translation** — Preserves cultural context, proper nouns, and place names | Gemini 3.6 Flash | Groq `gpt-oss-120b` |
| **Tag Extraction** — 3-8 semantic tags, category, region, and summary | Gemini 3.6 Flash | Groq `gpt-oss-120b` |
| **Language Detection** — ISO 639-1 language identification | Gemini 3.6 Flash | Groq `gpt-oss-120b` |
| **Summarization** — Long-text summarization for transcripts | Cohere `command-a-03-2025` | Skipped if unavailable |

AI **never edits the original** — it writes to separate Transcript, Translation, and Tag tables. The source media remains immutable.

### 👥 Community Trust Model
- **Verification** — Community members verify, flag, or suggest corrections to cultural records
- **Threaded Comments** — Nested discussions on each record
- **Following System** — Follow creators and cultural categories
- **Notifications** — Actor-aware notification system with read/unread tracking
- **Bookmarks** — Save records for later

### 🗺️ Cultural Map
Interactive Leaflet map showing geo-tagged cultural records across India with region filtering and clustering.

### 🎙️ Virasat Interview Flow
A 5-phase guided interview system for capturing oral histories:
1. **Subject Selection** — Choose a cultural topic
2. **Question Generation** — AI-assisted question preparation
3. **Audio Recording** — Browser-based voice recording (MediaRecorder API)
4. **AI Processing** — Transcription and enrichment of answers
5. **Review** — Verify and publish the interview

### 📱 Responsive Design
Full mobile support with bottom navigation, touch-friendly interactions, and adaptive layouts. Desktop features a sidebar with discovery rail and suggested users.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│  Vite + React 18 + Tailwind CSS + React Router v6   │
│  Pages: 14  │  Components: 37  │  Hooks: 5          │
├─────────────────────────────────────────────────────┤
│                   nginx (Production)                  │
│            Reverse proxy: /api → :5000                │
├─────────────────────────────────────────────────────┤
│                  Backend (Express 5)                  │
│  Routes: 47  │  Controllers: 12  │  Validators: 7   │
├─────────────┬─────────────┬─────────────────────────┤
│  Auth       │  AI Pipeline│  Community               │
│  JWT+cookie │  3 providers│  Verify/Correct/Follow   │
│  bcrypt     │  5 features │  Comments/Likes/Saves    │
├─────────────┴─────────────┴─────────────────────────┤
│               PostgreSQL 16 (Supabase)                │
│                   24 Prisma models                    │
├─────────────────────────────────────────────────────┤
│           Cloudinary (or local disk fallback)         │
└─────────────────────────────────────────────────────┘
```

### AI Pipeline Flow

```
Upload → Store locally → Cloudinary (or local fallback)
                │
                ▼
         ┌──────────────┐
         │   QUEUED      │
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │  PROCESSING   │ ← Language detection
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │ TRANSCRIBING  │ ← Groq Whisper (audio/video)
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │ TRANSLATING   │ ← Gemini → English translation
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │   TAGGING     │ ← Gemini → tags, category, region
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │  COMPLETED    │ ← Results stored in DB
         └──────────────┘
```

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Database Models | 24 |
| API Endpoints | ~47 |
| AI Pipeline Stages | 5 |
| AI Providers | 3 (Gemini, Groq, Cohere) |
| Supported Languages | 23 Indian languages |
| Frontend Pages | 14 |
| Frontend Components | 37 |
| E2E Tests | 23 passing |
| Docker Services | 3 (db, backend, frontend) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 16+ (or a Supabase project)
- **API Keys** (at minimum):
  - `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/apikey)
  - `GROQ_API_KEY` — [Groq Console](https://console.groq.com/keys)
  - Optional: `COHERE_API_KEY`, `CLOUDINARY_*` keys

### Quick Start

```bash
# Clone the repository
git clone https://github.com/stds9308Rohan/Viranikosh.git
cd Viranikosh

# Backend setup
cd backend
cp .env.example .env        # Fill in your DATABASE_URL, JWT_SECRET, API keys
npm install
npx prisma generate
npx prisma migrate deploy
npx tsx src/server.ts       # Runs on http://localhost:5000

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev                  # Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) and register an account.

### Docker Compose (Full Stack)

```bash
# Copy and fill in environment variables
cp .env.example .env

# Start everything
docker compose up --build

# The app is available at http://localhost:8080
```

Docker Compose spins up:
- **PostgreSQL 16** — with persistent volume
- **Backend** — Express API + Prisma migrations on startup
- **Frontend** — Vite build served via nginx with API proxy

---

## 🧪 Testing

### E2E Tests (Playwright)

```bash
cd frontend

# Install browsers (first time only)
npx playwright install chromium

# Run all 23 E2E tests
npx playwright test

# Run with UI mode
npx playwright test --ui
```

The Playwright suite spins up a mock AI server (port 3099) and tests the full user flow: register → login → create post → like → comment → follow → interview → notifications.

### CI Pipeline

Every push to `main` runs 3 parallel jobs:
1. **Backend** — Type checking (TypeScript)
2. **Frontend** — Type checking + linting + production build
3. **E2E** — Full Playwright suite against a throwaway PostgreSQL + mock AI

---

## 📁 Project Structure

```
Viranikosh/
├── backend/
│   ├── src/
│   │   ├── ai/                    # AI pipeline (providers, transcription, translation, tagging)
│   │   ├── controllers/           # Route handlers (auth, posts, upload, verification, interview, ...)
│   │   ├── middleware/            # Auth, rate limiting, upload validation, error handling
│   │   ├── routes/               # Express route definitions (~47 endpoints)
│   │   ├── scripts/              # Database seed script
│   │   ├── utils/                # JWT, password hashing, Prisma client, Cloudinary, responses
│   │   ├── validators/           # Zod request validation schemas
│   │   ├── app.ts                # Express app configuration
│   │   └── server.ts             # Entry point with env validation + DB connection retry
│   ├── prisma/
│   │   ├── schema.prisma         # 24 models with relations and indexes
│   │   └── migrations/           # Database migrations
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios client + typed API modules (10 files)
│   │   ├── components/           # Feature components (25) + UI primitives (12)
│   │   ├── contexts/             # AuthContext, InteractionsContext
│   │   ├── hooks/                # useAIProcessing, useAsync, useMediaQuery, useMediaRecorder, usePaginatedList
│   │   ├── pages/                # 14 pages (Home, Explore, Create, Map, Interview, ...)
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Date formatting, media utilities
│   ├── tests/                    # Playwright E2E tests
│   ├── nginx.conf                # Production reverse proxy config
│   ├── Dockerfile                # Multi-stage build (Vite → nginx)
│   └── package.json
├── .github/workflows/ci.yml      # CI: typecheck + lint + build + E2E
├── docker-compose.yml            # Full stack: db + backend + frontend
└── .env.example                  # Environment variable template
```

---

## 🔒 Security

- **JWT Authentication** with httpOnly cookies and `tokenVersion` revocation
- **bcrypt** password hashing with configurable rounds
- **Rate Limiting** — tiered limits (general, auth, strict) to prevent abuse
- **Ownership Checks** on all mutating operations
- **Input Validation** via Zod on every endpoint
- **Media Access Control** — drafts visible to owner only, interview audio restricted to owner
- **Security Headers** — Helmet (HSTS, Permissions-Policy) + nginx headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- **CORS** — environment-driven origin whitelist
- **Environment Validation** — fails fast on startup if required secrets are missing
- **SQL Injection Prevention** — Prisma ORM with parameterized queries
- **Search Injection Prevention** — LIKE wildcard escaping on all text search inputs
- **No secrets in responses** — API keys, passwords, internal fields stripped from all responses
- **Error handling** — stack traces and DB column names never leaked to clients

---

## 🌍 Supported Languages

English • Hindi • Marathi • Tamil • Telugu • Bengali • Gujarati • Kannada • Malayalam • Punjabi • Urdu • Rajasthani • Assamese • Odia • Nepali • Sinhala • Sindhi • Kashmiri • Dogri • Maithili • Santali • Khasi • Manipuri

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Framer Motion, Leaflet |
| **Backend** | Express 5, TypeScript, Prisma 5, Zod, bcryptjs, jsonwebtoken, Multer |
| **Database** | PostgreSQL 16 (Supabase) |
| **AI Providers** | Google Gemini, Groq, Cohere |
| **Storage** | Cloudinary (with local disk fallback) |
| **Infrastructure** | Docker Compose, nginx, GitHub Actions CI |
| **Testing** | Playwright (23 E2E tests) |

---

## 📝 API Overview

<details>
<summary><strong>Auth</strong> (4 endpoints)</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login (returns JWT in httpOnly cookie) |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/logout` | Logout (revokes all tokens) |

</details>

<details>
<summary><strong>Posts</strong> (7 endpoints)</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/posts` | Create a cultural record |
| GET | `/api/posts/feed` | Paginated feed with filtering |
| GET | `/api/posts/:id` | Get single record |
| PATCH | `/api/posts/:id` | Update record (owner only) |
| DELETE | `/api/posts/:id` | Delete record (owner only) |
| GET | `/api/posts/:id/related` | Get related records |
| POST | `/api/posts/:id/relations` | Link two cultural records |

</details>

<details>
<summary><strong>Social</strong> (8 endpoints)</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/posts/:id/like` | Like a record |
| DELETE | `/api/posts/:id/like` | Unlike a record |
| POST | `/api/posts/:id/save` | Bookmark a record |
| DELETE | `/api/posts/:id/save` | Remove bookmark |
| GET | `/api/posts/:id/comments` | Get comments (threaded) |
| POST | `/api/posts/:id/comments` | Add a comment |
| POST | `/api/users/:id/follow` | Follow a creator |
| DELETE | `/api/users/:id/follow` | Unfollow a creator |

</details>

<details>
<summary><strong>Upload & AI</strong> (2 endpoints)</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/uploads` | Upload media (triggers AI pipeline) |
| GET | `/api/uploads/:id/status` | Poll AI processing status |

</details>

<details>
<summary><strong>Verification</strong> (5 endpoints)</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/posts/:id/verify` | Verify or flag a record |
| POST | `/api/posts/:id/corrections` | Suggest a correction |
| GET | `/api/posts/:id/verifications` | Get verification history |
| GET | `/api/verification/queue` | Records needing verification |
| GET | `/api/verification/flagged` | Flagged records |

</details>

<details>
<summary><strong>Interviews</strong> (5 endpoints)</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/interviews` | Create interview session |
| GET | `/api/interviews/:id` | Get interview with questions |
| POST | `/api/interviews/:id/questions` | Add questions |
| POST | `/api/interviews/:id/audio` | Upload audio answer |
| POST | `/api/interviews/:id/complete` | Complete and trigger AI |

</details>

<details>
<summary><strong>Search, Map & Users</strong> (8 endpoints)</summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search` | Full-text search |
| GET | `/api/search/suggestions` | Autocomplete |
| GET | `/api/cultural-map` | Geo data for map view |
| GET | `/api/users/suggested` | Suggested users to follow |
| GET | `/api/users/:id` | Public profile |
| PATCH | `/api/users/me` | Update profile |
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/read-all` | Mark all read |

</details>

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for preserving India's cultural heritage**

*Viranikosh — विरानिकोश — आपकी विरासत, आपकी कहानी*

</div>
