# TalentFinder Recruiter Portal

Multi-tenant recruiter workspace for managing candidates and job orders, ranking matches by shared skills, and shortlisting candidates into submissions.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Router
- **Backend:** Node.js, Express, TypeScript, Zod, Multer
- **Database:** PostgreSQL (Docker Compose) via Prisma ORM

## Architecture

Request flow is always **Routes → Controllers → Services → Repositories**.

- Routes parse/forward requests and attach middleware.
- Controllers call services and shape HTTP responses.
- Services hold business logic (including skill-match intersection).
- Repositories are the only layer that talks to Prisma/PostgreSQL.

### Tenant scoping

Every tenant-owned table (`Candidate`, `JobOrder`, `Submission`) has a `tenantId` column. Repository functions for those entities require `tenantId` and always include it in the Prisma `where` clause. Express middleware `requireTenant` reads `tenantId` from the query string (or JSON body) and returns `400` when it is missing on scoped routes.

## Setup

### Prerequisites

- Node.js 20+
- Docker / Docker Compose
- npm

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

API listens on `http://localhost:4000`. Health check: `GET /api/health`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: `http://localhost:5173` (proxies `/api` and `/uploads` to the backend).

## Seed data

Idempotent seed creates tenants **LinkedIn**, **Monster**, and **Naukri**, ~30 shared skills, and per tenant 15 candidates + 5 job orders with overlapping skill sets so match rankings are meaningful on first run.

## Key API routes

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/tenants` | `?search=&page=` |
| POST | `/api/tenants` | `{ name }` |
| GET | `/api/skills` | Shared taxonomy |
| GET/POST | `/api/candidates` | Requires `tenantId`; POST supports multipart CV |
| GET/PUT/DELETE | `/api/candidates/:id` | Requires `tenantId` |
| GET/POST | `/api/job-orders` | Requires `tenantId` |
| GET | `/api/job-orders/:id/matches` | Skill intersection ranking |
| POST | `/api/job-orders/:id/shortlist` | `{ candidateId }`, idempotent |
| GET | `/api/submissions` | Requires `tenantId` |

## Assumptions

- Recruiters are tenant-scoped users in the schema; there is **no login UI** and no separate super-admin role beyond tenant creation.
- Skill matching is **exact skill ID / keyword** intersection (not fuzzy scoring).
- New submissions start with status **Shortlisted**.
- Optional **CV parsing** is available on Create Candidate (`POST /api/candidates/parse-cv` with `pdf-parse` / `mammoth`). Prefill is best-effort and always editable; manual entry with or without a file still works. Legacy `.doc` and empty/scanned files are treated as unreadable (no OCR).
- Optional **AI Match Insights** use Groq (`GROQ_API_KEY`, default model `openai/gpt-oss-20b`, overridable via `GROQ_MODEL`) via `GET /api/job-orders/:id/matches/insights`. Ranking stays deterministic skill overlap; insights are a separate non-blocking layer that silently no-ops if the key is missing or the call fails.
- Tenant context for list/CRUD screens is the selected tenant in the UI (persisted in `localStorage`) and is sent as a `tenantId` query parameter on API calls.
- Job order and candidate status values are plain strings (`Open` / `Closed`, `Shortlisted`) rather than DB enums.

## Project layout

```
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── middleware/
│   └── uploads/
└── frontend/
    └── src/
```
