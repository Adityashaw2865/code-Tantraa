# VyaparSetu

**Single-window business approval & compliance platform** — built for Smart India Hackathon 2026 (Problem Statement SIH26130, Maharashtra Single Window System).

VyaparSetu lets a business owner apply for every government approval/licence they need (trade licence, fire NOC, pollution clearance, etc.) through one dashboard, track status in real time, and lets government officers, inspectors, and admins process those applications — all backed by a real database, real auth, and a server-side rules/risk engine instead of hardcoded logic.

## Roles

| Role | Can do |
|---|---|
| **Applicant** | Register, build a business profile, get auto-computed required approvals, submit applications, upload documents, pay fees, raise grievances |
| **Officer** | Review/approve/reject assigned applications, verify documents |
| **Inspector** | Conduct and submit inspection reports |
| **Admin** | Manage departments, approval types, users, view audit logs |

## Tech stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, Multer file uploads, Gemini AI proxy
- **Frontend:** React + Vite + Tailwind CSS v4
- **Infra:** Docker Compose (Mongo + backend + frontend), GitHub Actions CI

## Getting started

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```
Runs on http://localhost:5050

### Frontend
```bash
cd govease2
npm install
cp .env.example .env
npm run dev
```
Runs on http://localhost:6060

### Demo logins (after seeding, password `Passw0rd!123`)
- `applicant@vyaparsetu.demo`
- `officer@vyaparsetu.demo`
- `inspector@vyaparsetu.demo`
- `admin@vyaparsetu.demo`

### Run with Docker
```bash
cp .env.docker.example .env
docker compose up --build
```

## Project structure
