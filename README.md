# LinkedBloom Scribe

An AI-powered personal branding platform that helps professionals build and manage their thought-leadership presence on LinkedIn — persona modeling, AI-assisted content generation, and an AI "PR agent" chat, backed by Firebase.

Full product/technical documentation lives in [project_plan/](project_plan/) (BRD, PRD, TRD, BACKLOG, SPRINTS).

## Tech Stack

- **Frontend:** Vite, React, TypeScript, shadcn-ui, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage, Cloud Functions)
- **AI:** Google Gemini, via Cloud Functions (`generateContent`, `personaAgent`, `prAgentChat`)
- **Deployment:** Docker (nginx-served static build) or Firebase Hosting

## Local Development

Requires Node.js 20+, Java (for the Firebase emulators), and the Firebase CLI.

Local dev runs **entirely against the Firebase Emulator Suite** — Auth, Firestore,
Storage, and Functions all run on your machine. No cloud project is touched and no
separate Firebase project is needed. (The one exception: Gemini can't be emulated,
so the local functions call real Vertex AI — app data still stays 100% local.)

```sh
npm install
cp .env.development.example .env.development          # emulator defaults; usually no edits needed
cp functions/.env.local.example functions/.env.local  # set VERTEX_PROJECT + a service-account key path

# terminal 1 — start the emulators (Auth/Firestore/Storage/Functions + UI on :4000)
npm run emulators

# terminal 2 — start the app (connects to the emulators automatically)
npm run dev
```

`npm run dev` runs in development mode (`.env.development`, `VITE_USE_EMULATORS=true`),
so the SDK points at the local emulators and the app shows a **DEV** badge. See
[Environments](#environments) and [project_plan/ENVIRONMENTS.md](project_plan/ENVIRONMENTS.md).

### Other scripts

```sh
npm run emulators   # build functions + start the full emulator suite
npm run build       # production build
npm run build:dev   # development-mode build
npm run lint         # eslint
npm run preview      # preview a production build locally
```

## Running with Docker

Docker builds and serves the static artifact via nginx — handy for testing the
built bundle, but it is **not** the emulator dev path (a container can't reach the
host emulators without extra networking). For day-to-day dev use `npm run dev` +
`npm run emulators`. The Docker host port is configurable via `APP_PORT` (default 3000):

```sh
APP_PORT=3100 docker compose up --build      # http://localhost:3100
```

## Environments

Complete dev/prod separation — local emulators for dev, the real Firebase project for prod:

| | Local dev | Production |
|--|--|--|
| Backend | Firebase Emulator Suite (Auth/Firestore/Storage/Functions, all local) | `contentmanager-ed707` |
| Trigger | `npm run dev` + `npm run emulators` | push to `main` branch |
| Vite mode | `development` (`VITE_USE_EMULATORS=true`) | `production` |
| Env file | `.env.development` (local) | `.env.production` (CI secrets) |
| AI (Gemini) | real Vertex AI via local service-account key | real Vertex AI via runtime SA |
| CI workflow | `.github/workflows/ci.yml` (build check only) | `.github/workflows/deploy.yml` (deploy) |
| DEV badge | shown | hidden |

The `dev` branch pushes run a CI build check (no deploy); merging to `main` deploys prod.
Config files are gitignored; copy the `*.example` templates.

## Project Structure

```
src/
  components/ui/   shadcn-ui components
  features/        feature modules (auth, dashboard, generator, calendar, linkedin, onboarding, profile, review)
  lib/firebase.ts   Firebase client init (auth, firestore, storage)
  hooks/
functions/
  src/ai/           Gemini-backed Cloud Functions
  src/middleware/   auth token verification
project_plan/        product & technical requirements, backlog, sprint plan
```

Firestore security rules, indexes, and Storage rules are defined in `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.
