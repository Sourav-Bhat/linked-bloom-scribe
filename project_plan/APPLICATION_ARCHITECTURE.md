# Application Architecture & Component Workflow
## LinkedBloom Scribe — As-Built Reference
**Version:** 1.0 | **Date:** June 2026 | **Scope:** Documents the application as it is actually implemented in `linked-bloom-scribe/`, not the target state in PRD/BACKLOG. See [Known Gaps vs Plan](#7-known-gaps-vs-the-plan) for what's still mocked or missing.

---

## 1. Tech Stack

### 1.1 Frontend
| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React 18 + TypeScript | |
| Build tool | Vite 5 + `@vitejs/plugin-react-swc` | |
| Routing | React Router DOM v6 | client-side only, `BrowserRouter` |
| Server state | TanStack Query v5 | `QueryClient` configured in `App.tsx`, retry: 1, no refetch-on-focus — not yet used by most pages (most data fetching is still plain `useEffect` + service calls) |
| UI components | shadcn/ui (Radix primitives) | full component set in `src/components/ui/` |
| Styling | Tailwind CSS v3 | `tailwindcss-animate`, custom `linkedin-blue` color tokens |
| Forms | React Hook Form + Zod | installed; used selectively (e.g. onboarding steps use plain controlled state instead) |
| Icons | lucide-react | |
| Toasts | `sonner` + shadcn `use-toast` (both present) | |
| Markdown rendering | `react-markdown` | used in `PrAgentChat.tsx` to render assistant replies |
| Charts | `recharts` | installed, not yet used anywhere in `src/` |

### 1.2 Backend (Firebase)
| Layer | Technology | Notes |
|-------|-----------|-------|
| Auth | Firebase Auth | email/password + Google OAuth popup |
| Database | Cloud Firestore | accessed directly from the client SDK for all CRUD — no Cloud Function sits in front of reads/writes except where AI is involved |
| File Storage | Firebase Storage | SDK initialized in `src/lib/firebase.ts`; only consumer today is the onboarding admired-posts image upload (`StepTwo.tsx`) |
| Serverless compute | Cloud Functions (2nd gen, Node.js 20) | only used for the three AI endpoints — see §6 |
| Hosting/deploy | Docker (nginx) locally; Firebase Hosting via GitHub Actions CI | |
| Environments | Two Firebase projects (dev/prod), selected by Vite mode — `npm run dev`/Docker/`dev` branch → dev project; `main` branch → prod. See [ENVIRONMENTS.md](ENVIRONMENTS.md). A DEV badge shows in every non-prod build. | |

### 1.3 AI
| Component | Detail |
|-----------|--------|
| Model | Gemini via Vertex AI, called server-side from Cloud Functions via `functions/src/utils/geminiClient.ts` — no API key; auth is the functions' own service account (`firebase-adminsdk-fbsvc@...`, needs the `Vertex AI User` role) |
| Model selection | Callers may pass an optional `model` field (validated against `SUPPORTED_MODELS` in `geminiClient.ts`); defaults to `gemini-2.5-flash` if omitted or invalid |
| Cloud Functions using it | `generateContent`, `personaAgent`, `prAgentChat` |
| Auth to functions | Firebase ID token in `Authorization: Bearer` header, verified by `functions/src/middleware/verifyToken.ts` |

### 1.4 Tooling
- ESLint 9 (`eslint.config.js`), TypeScript 5.5, no test runner configured (no Jest/Vitest in `package.json`)
- `npm run dev|build|build:dev|lint|preview` at the repo root; `functions/` has its own `package.json` with `build|serve|deploy`

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Browser — React SPA (Vite build)                            │
│  React Router → page components → feature hooks/services     │
└───────────────┬───────────────────────────────┬───────────────┘
                │ Firebase JS SDK                │ fetch + Bearer ID token
                ▼                                ▼
┌───────────────────────────────┐   ┌─────────────────────────────────┐
│  Firebase (client-reachable)  │   │  Cloud Functions (2nd gen)      │
│  - Auth                       │   │  generateContent                │
│  - Firestore (users/{uid}/…)  │   │  personaAgent                   │
│  - Storage (admiredPosts/)    │   │  prAgentChat                    │
└───────────────────────────────┘   └───────────────┬─────────────────┘
                                                      │
                                                      ▼
                                          ┌─────────────────────────┐
                                          │  Gemini API              │
                                          └─────────────────────────┘
```

Key point: **Firestore reads/writes for posts, profile, and persona happen directly from the browser** via the Firebase SDK (see `contentService.ts`, `profileService.ts`). Cloud Functions are only invoked for the three Gemini-backed operations — they are not a general API layer.

---

## 3. Routing Map (`src/App.tsx`)

| Path | Component | Guard |
|------|-----------|-------|
| `/login` | `LoginPage` | redirects to `/` (or `/onboarding`) if already authenticated |
| `/onboarding` | `OnboardingPage` | requires auth; redirects to `/` if `onboardingCompleted` is already true |
| `/` | `DashboardPage` | requires auth + completed onboarding; wrapped in `Layout` |
| `/profile` | `ProfilePage` | same guard, inside `Layout` |
| `/generator` | `GeneratorPage` | same guard, inside `Layout` |
| `/calendar` | `CalendarPage` | same guard, inside `Layout` |
| `/review/:postId` | `ReviewPage` | same guard, inside `Layout` |
| `*` | `NotFoundPage` | catch-all |

`onboardingCompleted` and `user` are resolved once in `App.tsx` via `onAuthStateChanged` + a single `getDoc(users/{uid})`, then passed down through `AuthContext` (consumed via the `useAuth()` hook in `src/features/auth/useAuth.tsx`).

**Note:** there is no `/settings` route in the router. The `Sidebar` component links to `/settings`, which currently 404s (this matches the known gap tracked as BACKLOG US-008).

---

## 4. Component-Level Workflow by Feature

### 4.1 App Shell
- `App.tsx` — top-level providers (`QueryClientProvider`, `AuthContext.Provider`, `TooltipProvider`, toasters), the Firebase `onAuthStateChanged` listener, and the route table.
- `Layout.tsx` — renders `Navbar` + `Sidebar` + `<Outlet />` for all authenticated routes; also runs a heuristic browser-extension-interference detector on mount (unrelated to the LinkedBloom Chrome extension in the roadmap — this just warns if ad-blockers etc. are breaking the page).
- `Sidebar.tsx` — static nav list (Dashboard, Profile, Generator, Calendar) + Settings link (currently dead) + Logout (`signOut()` from `authService.ts`).
- `ErrorBoundary.tsx` — wraps the whole app.

### 4.2 Auth (`src/features/auth/`)
- `authService.ts` — thin wrapper over Firebase Auth: `signInWithEmail`, `registerWithEmail`, `signInWithGoogle`, `signOut`, `getIdToken()`.
- `useAuth.tsx` — reads `{ user, setOnboardingCompleted }` from `AuthContext`.
- `LoginPage.tsx` — email/password + Google sign-in form; on success, `App.tsx`'s listener picks up the new `user` and redirects.
- No password reset / email verification flow exists yet.

### 4.3 Onboarding (`src/features/onboarding/`)
Linear 3-step wizard managed entirely in local state inside `OnboardingPage.tsx` (no router sub-routes):

```
StepOne (industry, experience, location, goal, LinkedIn URL)
   → StepTwo (3–5 topics, admired posts w/ optional image upload to Storage, no-go topic)
       → StepThree (posting cadence, preferred days, tone)
           → submit → callPersonaAgent()
                         1. setDoc(users/{uid}/persona/main, onboardingData)   — best-effort, non-fatal on failure
                         2. POST personaAgent Cloud Function with Bearer token
                         3. on response → PersonaSummary screen
```
- `PersonaSummary.tsx` — shows the generated persona (archetype, content pillars, posting rhythm, voice profile) with retry-on-error support; does not yet persist the *returned* persona back to Firestore itself (the function is expected to do that server-side per `personaAgent.ts`).
- Validation (`validateStepOne/Two/Three`) is hand-rolled, not Zod-based, despite Zod being installed.

### 4.4 Dashboard (`src/features/dashboard/DashboardPage.tsx`)
- On mount: `getUserProfile(user.uid)` + `getUserContents(user.uid)` (both Firestore reads via the respective services).
- Computes simple client-side metrics: total/draft/published/scheduled post counts, next scheduled post — no Cloud Function or analytics collection involved (matches PRD Epic 3, not yet built).

### 4.5 Content Generator (`src/features/generator/`)
The most fully-built feature. Composition:

```
GeneratorPage
 ├─ ContentForm           (topic / tone / instructions / hashtags toggle / length)
 ├─ ContentPreview        (shown once content is generated; inline edit + regenerate)
 └─ DraftsList            (shown when nothing is currently generated; links to /generator?edit={id})
```
All state and Firestore/Cloud-Function orchestration lives in the `useContentGeneration(userId)` hook, not in the page component:
- `handleSubmit` → `POST {VITE_CLOUD_FUNCTIONS_BASE_URL}/generateContent` with Bearer token → sets `generatedContent` (not yet saved).
- `handleRegenerateContent` → same endpoint with `regeneratePrompt` + `previousContent`, appends the prior version to a local `versions` array.
- `handleSaveContent` → `contentService.saveGeneratedContent` (new) or `updateContent` (edit mode) → Firestore `users/{uid}/posts/{postId}`.
- Editing an existing draft is done via the `?edit={postId}` query param, loaded with `contentService.getContent`.
- `contentService.ts` is the only data-access layer here: `saveGeneratedContent`, `getUserContents`, `getContent`, `updateContentStatus`, `updateContent` — all thin Firestore wrappers.

### 4.6 Calendar (`src/features/calendar/CalendarPage.tsx`)
- **Still mock data** — `initialScheduledContent` is a hardcoded array; nothing is fetched from Firestore.
- `handleEdit(postId)` navigates to `/review/:postId`, but since the data is mocked, this is currently disconnected from real posts.
- This matches BACKLOG US-004/US-005/US-006/US-007, none of which are implemented yet.

### 4.7 Review (`src/features/review/ReviewPage.tsx`)
- **Also mock data** — reads from a local `mockPosts` object keyed by `useParams().postId`, not Firestore. Version history UI and regenerate-with-feedback UI exist visually but operate on the mock object.
- This is the largest single file in the app (555 lines) but is not yet wired to real data — a good first target if continuing the BACKLOG S1 work.

### 4.8 Profile (`src/features/profile/ProfilePage.tsx`)
Four tabs, each a separate component, all scoped to `user.uid`:

| Tab | Component | Data source |
|-----|-----------|-------------|
| My Persona | `PersonaDisplay` | `getDoc(users/{uid}/persona/main)`; "Regenerate" button re-calls the `personaAgent` Cloud Function |
| PR Agent | `PrAgentChat` | loads history from `users/{uid}/chatMessages` (ordered by `createdAt`), then calls the `prAgentChat` Cloud Function for new turns |
| Edit Profile | `ProfileForm` | reads/writes `users/{uid}` document fields — note: `ProfilePage` currently passes it an empty `profile={{}}` and no-op `setProfile`, so the form re-fetches/manages its own state rather than relying on the parent |
| API Settings | `ApiKeySettings` | **`localStorage` only** — the LLM provider + API key never reach Firestore or any Cloud Function; this is a local dev convenience, not the encrypted-key feature described in PRD Feature 1.1/US-010 |

`PrAgentChat.tsx` posts to `prAgentChat` and correctly parses the SSE token-by-token stream (OpenAI delta-chunk shape: `data: {"choices":[{"delta":{"content":"..."}}]}`, terminated by `data: [DONE]`) — matches TRD §7.3's design intent.

### 4.9 LinkedIn (`src/features/linkedin/`)
- `LinkedInConnect.tsx`, `LinkedInAnalytics.tsx`, `linkedinService.ts` exist but are **not routed anywhere** in `App.tsx` and are not reachable from the UI.
- `linkedinService.ts` has no real LinkedIn API calls — `postToLinkedIn` just logs to console and flips Firestore status; `getPostAnalytics` returns `Math.random()` mock numbers. It also writes to a top-level `posts/{id}` collection (not the `users/{uid}/posts/{id}` subcollection used everywhere else) — a pre-existing inconsistency to fix before wiring this up for real.
- Per `project_plan/SPRINTS.md`, these are intentional stubs for Sprint 2 — do not delete them.

---

## 5. Data Flow: Content Generation (representative end-to-end flow)

```
1. User fills ContentForm → handleSubmit (useContentGeneration)
2. getIdToken() → Firebase Auth ID token
3. POST {CLOUD_FUNCTIONS_BASE_URL}/generateContent  { topic, tone, instructions, includeHashtags, postLength }
     Cloud Function (generateContent.ts):
       a. verifyToken(req) → uid
       b. build prompt, call Gemini via geminiClient.ts
       c. return { title, content, hashtags }
4. Frontend sets generatedContent in local state — ContentPreview renders it
5. User edits inline or clicks Regenerate (loops back to step 3 with previousContent + regeneratePrompt)
6. User clicks Save → contentService.saveGeneratedContent()
     addDoc(users/{uid}/posts, { ...fields, status: 'draft', createdAt, updatedAt })
7. DraftsList re-fetches via getUserContents(uid) → shown in the drafts panel
```

---

## 6. Cloud Functions Reference (`functions/src/`)

| Function | File | Auth | Purpose |
|----------|------|------|---------|
| `generateContent` | `ai/generateContent.ts` | Firebase ID token | Generates a draft post (title/content/hashtags) from topic/tone/instructions, optionally regenerating with feedback |
| `personaAgent` | `ai/personaAgent.ts` | Firebase ID token | Turns onboarding answers into a structured persona (archetype, content pillars, posting rhythm, voice profile) |
| `prAgentChat` | `ai/prAgentChat.ts` | Firebase ID token | Conversational PR-agent chat backing `PrAgentChat.tsx` |

All three are registered in `functions/src/index.ts` and share `middleware/verifyToken.ts` (Bearer token → `uid`) and `utils/geminiClient.ts` / `utils/corsConfig.ts`.

---

## 7. Known Gaps vs. the Plan

For context against `PRD.md`/`BACKLOG.md`, the following are **not yet real** in the current code, even though the planning docs describe them as built or in-scope:

- `/settings` route — linked from `Sidebar`, not registered in `App.tsx` (404).
- Calendar and Review pages run entirely on hardcoded mock arrays, not Firestore.
- LinkedIn OAuth/publish/analytics is unimplemented; `linkedinService.ts` is a local mock and isn't routed into the UI.
- API key management is `localStorage`-only, not persisted or encrypted server-side.
- No Chrome extension code exists in this repo yet (Epic 5 in PRD).
- `postAnalytics`, `engagements`, `inspirations`, `extensionEvents`, `linkedinAccount` Firestore subcollections from `TRD.md` §4.1 are not yet written to by any code path.

These gaps line up with Sprint 1–5 of `BACKLOG.md` — useful as a checklist of what's actually left to build versus what's already done.
