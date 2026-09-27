# VyaparSetu Backend (SIH26130)

Node.js + Express + MongoDB API for the VyaparSetu Business Approval & Compliance platform.
Replaces the frontend's `localStorage`-only demo data with a real database, real auth,
and a server-side (authoritative) rules/risk engine.

## Stack
- Express 4
- MongoDB + Mongoose
- JWT auth (bcrypt password hashing)
- Multer for real file uploads (local disk in dev; swap to S3 later)
- Gemini AI proxy (keeps the API key server-side)

## Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, and (optionally) GEMINI_API_KEY

# make sure MongoDB is running locally, or point MONGO_URI at Atlas

npm run seed   # inserts departments, approval types, and one demo user per role
npm run dev    # starts the API on http://localhost:5000 with nodemon
```

Demo logins after seeding (password for all: `Passw0rd!123`):

| Role | Email |
|---|---|
| applicant | applicant@vyaparsetu.demo |
| officer | officer@vyaparsetu.demo |
| inspector | inspector@vyaparsetu.demo |
| admin | admin@vyaparsetu.demo |

## Folder structure

```
src/
  config/db.js          Mongo connection
  models/                Mongoose schemas (mirror frontend src/types/index.ts)
  middleware/            auth (JWT), upload (multer), errorHandler
  routes/                one file per resource, mounted under /api/*
  services/rulesEngine.js  server-side port of frontend rulesEngine.ts
  utils/                 token signing, audit log writer
  seed/seed.js           departments + approval types + demo users
  app.js                 express app wiring
  server.js              entrypoint
```

## API overview

All routes are prefixed `/api`. Auth via `Authorization: Bearer <token>` header
(token returned from `/auth/login` or `/auth/register`).

- `POST /auth/register` — public signup (always creates an `applicant`)
- `POST /auth/login`
- `GET /auth/me`
- `POST /users` — admin provisions officer/inspector/admin accounts
- `GET /departments`, `POST /departments`, `PATCH /departments/:id`
- `GET /approval-types`, `POST /approval-types`, `PATCH /approval-types/:id`
- `POST /business-profiles` — applicant onboarding wizard submits here
- `GET /business-profiles/:id/required-approvals` — runs the server-side rules engine
- `POST /applications`, `GET /applications`, `GET /applications/:id`
- `POST /applications/:id/submit` — validates required docs, computes risk + SLA date
- `PATCH /applications/:id/status` — enforced status state-machine (see `ALLOWED_TRANSITIONS`)
- `PATCH /applications/:id/assign-officer`
- `POST /documents` — multipart file upload (`file` field)
- `GET /documents?businessId=...`, `GET /documents/:id/download`, `PATCH /documents/:id/verify`
- `POST /inspections`, `GET /inspections`, `PATCH /inspections/:id/checklist`, `POST /inspections/:id/submit-report`
- `POST /licences`, `GET /licences?businessId=...`
- `GET /licences/verify/:code` — **public**, no auth (powers the QR/document verification modal)
- `POST /grievances`, `GET /grievances`, `PATCH /grievances/:id`
- `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- `GET /audit-logs` — read-only, admin/admin
- `POST /ai/ask` — proxies to Gemini using the server-held `GEMINI_API_KEY`

## Role-based access

Every route that mutates data is protected by `requireAuth` + `requireRole(...)`. Read
routes are scoped per role inside the handler itself (e.g. `GET /applications` only
returns an applicant's own applications, or an officer's assigned/department queue).

## What's NOT done yet

- Frontend (`govease2/`) still reads/writes `localStorage` via `AppContext.tsx` — it is
  not yet wired to call this API. That's the next integration step.
- Only a representative subset of `APPROVAL_TYPES` from the frontend's `initialData.ts`
  is seeded; add the rest to `src/seed/seed.js` the same way.
- No automated tests yet.
- File storage is local disk (`uploads/`) — fine for a demo/SIH judge round, swap for
  S3/GCS before any real deployment.
