# Environments — Dev / Prod Separation

LinkedBloom Scribe runs against **two completely separate Firebase projects**. Nothing
is shared between them — Auth users, Firestore data, Storage files, and Cloud Functions
all live in whichever project the current build is wired to.

| | Dev | Prod |
|--|--|--|
| Firebase project | _your dev project_ (e.g. `contentmanager-dev`) | `contentmanager-ed707` |
| Selected by | Vite `development` mode | Vite `production` mode |
| Frontend config | `.env.development` (local) or `*_DEV` GitHub secrets (CI) | `.env.production` (CI secrets only) |
| Runs when | `npm run dev`, local Docker, or push to **`dev`** branch | push to **`main`** branch |
| Deploy workflow | `.github/workflows/deploy-dev.yml` | `.github/workflows/deploy.yml` |
| In-app DEV badge | visible (amber, bottom-right) | hidden |

How the switch works: Vite loads `.env.<mode>` per build mode. `VITE_APP_ENV` drives the
DEV badge (`src/components/DevModeBadge.tsx`); the `VITE_FIREBASE_*` values point the
client SDK at the right project; Cloud Functions are project-portable (no hardcoded
project/service-account) and call Vertex AI in whatever project they're deployed to.

---

## One-time setup for the DEV project

### 1. Create the Firebase project
- Firebase console → Add project (e.g. `contentmanager-dev`). Enable **Blaze** billing
  (required for 2nd-gen Cloud Functions).
- Add a **Web app** → copy its config into `.env.development` (locally) using
  `.env.development.example` as the template.

### 2. Enable services / APIs
In the dev project, enable (console or `gcloud`):
- **Authentication** → enable Email/Password + Google providers
- **Firestore** → create database
- **Storage** → click **Get Started** to provision the bucket
- APIs: `aiplatform` (Vertex AI), `cloudfunctions`, `cloudbuild`, `artifactregistry`,
  `run`, `eventarc`, `pubsub`, `secretmanager`, `cloudscheduler`, `serviceusage`,
  `firebasestorage`, `cloudbilling`
  _(the deploy will auto-enable most of these the first time, given the roles below)_

### 3. Service account for CI deploys
- Project settings → Service accounts → **Generate new private key** (Admin SDK).
- Grant that service account these roles (IAM page):
  `Firebase Admin`, `Service Usage Admin`, `Service Account User`,
  `Artifact Registry Administrator`, `Cloud Functions Admin`.
- Grant the dev project's **default Functions runtime service account** the
  `Vertex AI User` role (`roles/aiplatform.user`) so deployed functions can call Gemini.
  (Prod pins functions to its `firebase-adminsdk` account instead — see `deploy.yml`.)

### 4. GitHub secrets for the dev workflow
`deploy-dev.yml` (push to `dev`) reads these — add them under
**repo → Settings → Secrets and variables → Actions**:

| Secret | Value |
|--|--|
| `FIREBASE_SERVICE_ACCOUNT_DEV` | full JSON of the dev Admin SDK key from step 3 |
| `VITE_FIREBASE_API_KEY_DEV` | dev web config |
| `VITE_FIREBASE_AUTH_DOMAIN_DEV` | dev web config |
| `VITE_FIREBASE_PROJECT_ID_DEV` | dev project id (also used as the deploy target) |
| `VITE_FIREBASE_STORAGE_BUCKET_DEV` | dev web config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID_DEV` | dev web config |
| `VITE_FIREBASE_APP_ID_DEV` | dev web config |
| `VITE_CLOUD_FUNCTIONS_BASE_URL_DEV` | `https://us-central1-<dev-project>.cloudfunctions.net` |

### 5. Point `.firebaserc` at the dev project
Replace `REPLACE_WITH_DEV_PROJECT_ID` in `.firebaserc` with the dev project id, enabling
`firebase use dev` / `firebase use prod` for manual CLI work.

---

## Daily workflow
- **Local dev:** `npm run dev` (or `APP_PORT=3100 docker compose up --build`) → dev project.
- **Ship to dev backend:** push to `dev` → `deploy-dev.yml` deploys hosting + functions +
  rules to the dev project.
- **Ship to prod:** merge `dev` → `main` → `deploy.yml` deploys to `contentmanager-ed707`.

## Notes / gotchas
- Local config files are **gitignored**; only the `*.example` templates are committed.
- A build with no env file shows the DEV badge by default (fail-safe — never silently "prod").
- `firebase-tools` is pinned to run under Node 20 in CI (newer Node majors break its
  bundled networking deps).
- Prod functions keep running as the `firebase-adminsdk-fbsvc@contentmanager-ed707…`
  service account (set via `FUNCTIONS_SERVICE_ACCOUNT` in `deploy.yml`), so the prod
  runtime identity is unchanged by the portability refactor.
