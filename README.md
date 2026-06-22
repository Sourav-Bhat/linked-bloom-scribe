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
cp .env.example .env   # fill in your Firebase project config
npm run dev
```

The app expects a Firebase project with Auth, Firestore, and Storage enabled. See `.env.example` for the required `VITE_FIREBASE_*` variables and the Cloud Functions base URL.

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

A Dockerfile builds the Vite app and serves it via nginx on port 3000:

```sh
docker compose up --build
```

Then open http://localhost:3000.

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
