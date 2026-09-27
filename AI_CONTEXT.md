# AI_CONTEXT — read this first (saves tokens; don't re-scan the whole repo)

**App:** VyaparSetu — single-window business approvals (India). 4 roles: `applicant`, `officer`, `inspector`, `admin`.
**Stack:** Backend = Node/Express/Mongoose (`backend/`, port 5050). Frontend = React+Vite+Tailwind v4 (`govease2/`, port 6060).
**Run:** `cd backend && npm i && npm run seed && npm run dev` | `cd govease2 && npm i && npm run dev`
**Check before finishing:** `cd govease2 && npx tsc --noEmit` and `for f in $(find backend/src -name '*.js'); do node --check $f; done`
**Demo logins** (after seed, pw `Passw0rd!123`): applicant@ / officer@ / inspector@ / admin@ `vyaparsetu.demo`

## Backend map (`backend/src`)
- `app.js` mounts routes under `/api/*`; `server.js` boots; `config/db.js` mongo.
- `routes/*.routes.js` = one file per resource (auth, users, departments, approvalTypes, businessProfiles, applications, documents, inspections, licences, grievances, notifications, auditLogs, ai). List endpoints return wrapped JSON: `{ applications: [...] }`.
- `middleware/auth.js`: `requireAuth`, `requireRole('officer','admin')`. `models/` = Mongoose schemas. `seed/seed.js` = demo data.
- Only `applicant` can self-register; other roles are created by `admin` (`POST /api/users`) or seed.

## Frontend map (`govease2/src`)
- `context/AppContext.tsx` = ALL app state + actions (localStorage demo store, prefix `govease_v2_`). Big file: grep, don't read it whole.
- `services/authService.ts` (JWT login/session), `dataService.ts` (backend calls + unwraps responses), `aiService.ts` (calls `/api/ai/ask`, local fallback), `rulesEngine.ts`.
- `components/<role>/` dashboards, `components/modals/`, `components/layout/Navbar.tsx`, `App.tsx` = routing by `currentRole`.
- `data/initialData.ts` = demo data (DEMO_USERS etc.), `types/index.ts` = types.

## Data flow (important)
Not logged in -> everything is local demo data (persona switcher "demo access").
Logged in (JWT) -> `loadWorkspace()` replaces local data with server data. Wired to backend today: login/register, business profile, application create/submit, workspace load, AI.
**Still local-only (TODO, one at a time, test each):** document upload, officer approve/reject/query, inspections, licence renewal, grievances, notifications.

## Rules for editing
- Keep it simple; no new libraries. Change only the files needed. Never touch `.env`.
- Adding a role/permission => update `models/User.js` ROLES, `types/index.ts`, `seed.js`, `AuthModal.tsx`, `Navbar.tsx`, `App.tsx`.
