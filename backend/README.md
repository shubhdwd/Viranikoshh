# Viranikosh — Backend

## Project Overview

Viranikosh is a cultural heritage platform where people record local cultural content (songs, stories, festivals, interviews). The backend orchestrates the full pipeline: upload original media, AI-transcribe, translate, summarize, and tag the content, then let the community verify it. The result is a searchable, map-based repository of preserved cultural knowledge.

**Tagline:** *"Original Source + AI Enrichment + Community Trust"*

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express
- **ORM:** Prisma
- **Database:** PostgreSQL (Supabase)
- **Auth:** JWT + bcrypt password hashing
- **File Storage:** Cloudinary (with local disk fallback)
- **AI Services:**
  - Groq Whisper (`whisper-large-v3`) — speech-to-text transcription
  - Gemini 2.5 Flash — translation, tag extraction, summarization, language detection
- **Security:** Helmet, CORS, express-rate-limit, Zod validation
- **Deployment:** Ready for any Node.js host (e.g., Render, Railway, VPS)

---

## What's Built and Working

### Auth
- `POST /api/auth/register` — create user + profile, return JWT
- `POST /api/auth/login` — authenticate, return JWT
- `GET /api/auth/me` — return current user profile
- `POST /api/auth/logout` — stateless logout (client drops token)

### Cultural Posts
- `POST /api/posts` — create post with optional media/tags
- `GET /api/posts/feed` — paginated feed of published posts
- `GET /api/posts/:id` — get single post (drafts visible to owner/admin)
- `PATCH /api/posts/:id` — update own post
- `DELETE /api/posts/:id` — delete own post
- `GET /api/posts/:id/related` — get related posts via CulturalRelation

### Upload & AI Pipeline
- `POST /api/uploads` — multipart upload, stores in Cloudinary (local fallback), creates ProcessingJob, triggers AI pipeline
- `GET /api/uploads/:id/status` — returns processing status, transcripts, translations, tags
- Pipeline stages: `QUEUED → PROCESSING → TRANSCRIBING → TRANSLATING → TAGGING → COMPLETED`
- On failure: job marked `FAILED` with error message; original media never overwritten

### Social
- `POST /api/posts/:id/like` / `DELETE /api/posts/:id/like` — like/unlike
- `POST /api/posts/:id/save` / `DELETE /api/posts/:id/save` — save/unsave
- `GET /api/posts/:id/comments` — list top-level comments with nested replies
- `POST /api/posts/:id/comments` — create comment or reply
- `POST /api/users/:id/follow` / `DELETE /api/users/:id/follow` — follow/unfollow

### Verification & Corrections
- `POST /api/posts/:id/verify` — community verification (upsert, self-verify blocked)
- `POST /api/posts/:id/corrections` — suggest corrections with field + suggestion
- `GET /api/posts/:id/verifications` — list verifications and corrections

### Interviews (Virasat)
- `POST /api/interviews` — create interview
- `GET /api/interviews/:id` — get interview with questions and responses
- `POST /api/interviews/:id/questions` — set questions (replaces existing)
- `POST /api/interviews/:id/audio` — upload audio response to a question
- `POST /api/interviews/:id/complete` — mark interview completed

### Search & Map
- `GET /api/search` — full-text search across title/description/content, filter by tag/region/category
- `GET /api/search/suggestions` — autocomplete suggestions (titles, tags, regions, categories)
- `GET /api/cultural-map` — geo-located posts with lat/lng for map display

### Notifications
- `GET /api/notifications` — paginated list for authenticated user
- `PATCH /api/notifications/:id/read` — mark notification as read (ownership check)

### Security
- JWT authentication on protected routes
- bcrypt password hashing
- Role-based access control (USER, ADMIN)
- Input validation on every endpoint (Zod)
- File validation (MIME, extension, size, category limits)
- Rate limiting (strict on auth/upload/writes, general on all `/api`)
- CORS with env-driven origins + dev localhost fallback
- Ownership checks on all write endpoints
- Helmet security headers

---

## How to Run Locally

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase account)
- Groq API key
- Gemini API key
- Cloudinary account

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd <repo-dir>
   npm install
   ```

2. **Configure environment variables**
   Copy `.env` and fill in your values:
   ```env
   JWT_SECRET="your-jwt-secret"
   JWT_EXPIRES_IN="7d"
   PORT=5000
   NODE_ENV=development
   UPLOAD_DIR="./uploads"

   # Comma-separated allowed frontend origins
   CORS_ORIGINS="http://localhost:3000,http://localhost:5173"

   # PostgreSQL connection (Supabase or self-hosted)
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   DIRECT_URL="postgresql://user:password@host:5432/dbname"

   # AI services
   GROQ_API_KEY="gsk_..."
   GEMINI_API_KEY="AIza..."

   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

3. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   # or for local dev:
   npx prisma db push
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`.

### API Testing

Use the included test script or any HTTP client:

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Create a post (replace TOKEN)
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Folk Song","content":"Lyrics here...","category":"Folk Song","region":"Maharashtra"}'

# Upload audio (replace TOKEN and POST_ID)
curl -X POST "http://localhost:5000/api/uploads?postId=POST_ID" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/audio.mp3;type=audio/mpeg"

# Check upload status
curl http://localhost:5000/api/uploads/MEDIA_ID/status \
  -H "Authorization: Bearer TOKEN"
```

---

## What's Remaining

- Demo data seeding
- Final bug fixing pass
- Performance check
- Final testing before demo
