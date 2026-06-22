# LinkedBloom Scribe

An AI-powered personal branding platform that helps professionals build and manage their thought-leadership presence on LinkedIn — persona modeling, AI-assisted content generation, and an AI "PR agent" chat, backed by Firebase.

Full product/technical documentation lives in [project_plan/](project_plan/) (BRD, PRD, TRD, BACKLOG, SPRINTS).

## Tech Stack

- **Frontend:** Vite, React, TypeScript, shadcn-ui, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage, Cloud Functions)
- **AI:** Google Gemini, via Cloud Functions (`generateContent`, `personaAgent`, `prAgentChat`)
- **Deployment:** Docker (nginx-served static build) or Firebase Hosting

## Local Development

Requires Node.js 20+.

```sh
npm install
cp .env.development.example .env.development   # fill in your DEV Firebase project config
npm run dev
```

`npm run dev` runs in **development mode** and reads `.env.development`, so local work always talks to the **dev** Firebase project — never production. See [Environments](#environments) below for the full dev/prod separation model.

### Cloud Functions

Functions live in [functions/](functions/) and are deployed separately:

```sh
cd functions
npm install
npm run build
npm run deploy        # firebase deploy --only functions
# or, for local testing:
npm run serve          # firebase emulators:start --only functions
```

### Other scripts

```sh
npm run build       # production build
npm run build:dev   # development-mode build
npm run lint         # eslint
npm run preview      # preview a production build locally
```

## Running with Docker

A Dockerfile builds the Vite app and serves it via nginx. The image builds in
**development mode** by default (dev Firebase project), since Docker here is a
local test environment. The host port is configurable via `APP_PORT` (default 3000):

```sh
APP_PORT=3100 docker compose up --build      # http://localhost:3100
```

For a production-config image: `docker build --build-arg BUILD_MODE=production .`
(requires a local `.env.production`, which normally only exists in CI).

## Environments

The app has complete dev/prod separation — two Firebase projects, selected by Vite mode:

| | Local dev / Docker | Production |
|--|--|--|
| Trigger | `npm run dev`, `docker compose up`, or push to `dev` branch | push to `main` branch |
| Vite mode | `development` | `production` |
| Env file | `.env.development` (local) / dev GitHub secrets (CI) | `.env.production` (CI secrets only) |
| Firebase project | your dev project | `contentmanager-ed707` |
| CI workflow | `.github/workflows/deploy-dev.yml` | `.github/workflows/deploy.yml` |
| DEV badge | shown | hidden |

Config files are gitignored; copy the `*.example` templates. `.firebaserc` defines
`dev` and `prod` aliases (`firebase use dev` / `firebase use prod`).

**Setting up the dev project** — see [project_plan/ENVIRONMENTS.md](project_plan/ENVIRONMENTS.md)
for the one-time checklist (create project, enable APIs, init Storage, grant the
runtime service account `Vertex AI User`, and add the `*_DEV` GitHub secrets).

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
