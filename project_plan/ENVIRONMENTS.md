# Environments — Dev / Prod Separation

LinkedBloom Scribe keeps development and production completely separate **without a
second Firebase project**. Local development runs entirely on the **Firebase Emulator
Suite** (Auth, Firestore, Storage, and Functions all on your machine); production is
the real `contentmanager-ed707` project. Dev data is local and ephemeral and never
touches the cloud.

| | Dev (local) | Prod |
|--|--|--|
| Backend | Firebase Emulator Suite — all local | `contentmanager-ed707` |
| Selected by | Vite `development` mode + `VITE_USE_EMULATORS=true` | Vite `production` mode |
| Frontend config | `.env.development` (gitignored; emulator defaults) | `.env.production` (CI secrets) |
| Runs when | `npm run dev` + `npm run emulators` | push to **`main`** branch |
| CI workflow | `.github/workflows/ci.yml` — build check, no deploy | `.github/workflows/deploy.yml` — full deploy |
| In-app DEV badge | visible (amber, bottom-right) | hidden |

### The one thing that can't be emulated: Gemini

Vertex AI is a real cloud API, so when the local Functions emulator runs the AI
functions they call **real Gemini**. Only stateless inference leaves your machine —
all app data (users, posts, persona docs, uploads) stays in the local emulators.
`functions/.env.local` provides the credentials for those calls:

- `VERTEX_PROJECT` — a real GCP project to bill inference to (reuse the existing one).
- `GOOGLE_APPLICATION_CREDENTIALS` — absolute path to a service-account key with the
  `Vertex AI User` role on that project.

In a deployed (prod) function `VERTEX_PROJECT` is unset and the ambient project is
the live one, so prod behavior is unchanged.

---

## Observability (Langfuse)

Every Gemini call is traced to Langfuse from `functions/src/utils/geminiClient.ts`
(via `utils/langfuse.ts`). Tracing is **optional** — if no keys are present it's a
silent no-op, so it never blocks a request or a deploy.

Each trace records the input/output, model, token usage, the caller's Firebase
`userId`, and tags:

```
linkedbloom · env:<local|production> · fn:<generateContent|personaAgent|prAgentChat> · model:<…> · <feature tags>
```

`env:` comes from `FUNCTIONS_EMULATOR`, so local and prod traffic are split — and
dev/prod also use **separate Langfuse projects**:

| | Langfuse project | Keys come from |
|--|--|--|
| Dev (local emulator) | dev project | `functions/.env.local` (gitignored) |
| Prod (deployed) | prod project | GitHub secrets → CI writes `functions/.env` at deploy |

Config vars: `LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_BASE_URL`
(defaults to `https://cloud.langfuse.com`). Prod keys live in the repo Actions
secrets of the same name; `deploy.yml` writes them into `functions/.env` so the
deployed functions pick them up as runtime env (no Firebase Secret Manager needed).

---

## Local dev setup (one-time)

1. **Install prerequisites**
   - Node.js 20+, the Firebase CLI (`npm i -g firebase-tools`), and **Java** (the
     Firestore/Auth emulators need a JRE — `java -version` to check; `brew install temurin` if missing).
2. **Create the env files** (both gitignored; templates are committed)
   ```sh
   cp .env.development.example .env.development            # emulator defaults — usually no edits
   cp functions/.env.local.example functions/.env.local   # set VERTEX_PROJECT + key path
   ```
3. **Run it** (two terminals)
   ```sh
   npm run emulators   # builds functions, starts Auth/Firestore/Storage/Functions + UI on :4000
   npm run dev         # app on :8080, auto-connected to the emulators
   ```
4. Open the app — you'll see the **DEV** badge. Sign up / log in: the user is created
   in the **Auth emulator**, data lands in the **Firestore/Storage emulators**, and the
   emulator UI at http://localhost:4000 lets you inspect everything.

Emulator ports (see `firebase.json`): Auth `9099`, Functions `5001`, Firestore `8088`
(8080 is Vite), Storage `9199`, UI `4000`.

---

## Daily workflow
- **Develop locally** on the `dev` branch against the emulators.
- **Push `dev`** → `ci.yml` build-checks the web app + functions (no deploy).
- **Merge `dev` → `main`** → `deploy.yml` deploys hosting + functions + rules to prod.

## Notes / gotchas
- Local config files (`.env*`, `functions/.env.local`) are **gitignored**; only the
  `*.example` templates are committed.
- A build with no env file shows the DEV badge by default (fail-safe — never silently "prod").
- `firebase-tools` is pinned to run under Node 20 in CI (newer Node majors break its
  bundled networking deps).
- Prod functions run as `firebase-adminsdk-fbsvc@contentmanager-ed707…` (pinned via
  `FUNCTIONS_SERVICE_ACCOUNT` in `deploy.yml`); locally the same code runs in the
  emulator with credentials from `functions/.env.local`.
- Emulator data is in-memory by default (cleared on stop). To persist across runs:
  `firebase emulators:start --import=./.emulator-data --export-on-exit`.
