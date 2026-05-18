# Technical Requirements Document (TRD)
## LinkedBloom Scribe — Firebase Architecture
**Version:** 2.0 | **Date:** May 2026 | **Owner:** Sourav Bhat | **Status:** Approved
**Change from v1.0:** Migrated from Supabase to Firebase + Firestore + Cloud Functions based on full codebase audit by Claude Code.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│   React 18 + TypeScript + Vite + Tailwind + shadcn-ui           │
│   ┌──────────────────────┐  ┌────────────────────────────────┐  │
│   │    Web App           │  │  Chrome Extension (Manifest V3) │  │
│   │  Firebase SDK v10    │  │  content script + service worker│  │
│   └──────────────────────┘  └────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     FIREBASE PLATFORM                            │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐  │
│  │ Firebase Auth│  │   Firestore   │  │  Firebase Storage    │  │
│  │ email/pass + │  │   (NoSQL DB)  │  │  user uploads        │  │
│  │ Google OAuth │  │               │  │                      │  │
│  └──────────────┘  └───────────────┘  └──────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Cloud Functions (2nd gen — Node.js 20)                  │   │
│  │  generateContent | personaAgent | prAgentChat (streaming) │   │
│  │  linkedinPublish | linkedinAnalytics | sendEmail          │   │
│  │  generateCommentOptions | generateDraftFromCapture        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌────────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Cloud Scheduler   │  │  Firebase    │  │  Cloud Run     │  │
│  │  (cron jobs)       │  │  Hosting     │  │  (streaming)   │  │
│  └────────────────────┘  └──────────────┘  └────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  Gemini API    │  │  LinkedIn API v2  │  │  Resend (email) │  │
│  │  via Lovable   │  │  OAuth + posts +  │  │  Sprint 6       │  │
│  │  AI Gateway    │  │  analytics        │  │                 │  │
│  └────────────────┘  └──────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend (confirmed from codebase audit)

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| Framework | React | 18.x | ✅ Installed |
| Language | TypeScript | 5.x | ✅ Installed |
| Build tool | Vite + SWC | 5.x | ✅ Installed |
| Routing | React Router DOM | v6 | ✅ Installed |
| UI Components | shadcn/ui (Radix) | latest | ✅ Installed — do not change |
| Styling | Tailwind CSS | v3 | ✅ Installed |
| State / data | React Query | v5 | ✅ Installed — use consistently |
| Forms | React Hook Form + Zod | latest | ✅ Installed |
| Firebase SDK | firebase | 10.8.0 | ✅ Installed — activate |
| AI streaming | Native fetch + ReadableStream | — | ✅ Keep SSE pattern |
| Markdown | react-markdown | latest | ✅ Installed |

### 2.2 Backend (Firebase Platform)

| Layer | Technology | Migration Action |
|-------|-----------|-----------------|
| Authentication | Firebase Auth | Replace Supabase Auth |
| Database | Cloud Firestore | Replace Supabase Postgres |
| File Storage | Firebase Storage | Replace Supabase Storage |
| Backend Logic | Cloud Functions 2nd gen, Node.js 20 | Replace Supabase Edge Functions (Deno) |
| Scheduled Tasks | Cloud Scheduler | Replace Supabase pg_cron |
| Hosting | Firebase Hosting | Replace Lovable hosting (optional) |
| Streaming (SSE) | Cloud Run (via Cloud Functions 2nd gen) | Required for prAgentChat |

### 2.3 External Services

| Service | Purpose | Notes |
|---------|---------|-------|
| Gemini 2.5 Pro | Persona generation, content creation, chat | Via `ai.gateway.lovable.dev` + `LOVABLE_API_KEY` — preserve existing |
| Gemini Flash | PR agent chat (faster, cheaper) | Same gateway |
| LinkedIn API v2 | OAuth, publish posts, fetch analytics | Custom PKCE flow via Cloud Function |
| Resend | Transactional email (Sprint 6) | New |

### 2.4 Packages to Remove / Add

```bash
# REMOVE from root package.json:
npm uninstall @supabase/supabase-js

# ALREADY INSTALLED (no action needed):
# firebase@^10.8.0

# ADD to functions/package.json (new Cloud Functions folder):
# firebase-admin@^12.0.0
# firebase-functions@^5.0.0
# cors@^2.8.5

# ADD to root (devDependency):
# firebase-tools@^13.x  (CLI for deployment)
```

---

## 3. Firebase Project Configuration

### 3.1 Project Details
- **Project ID:** `contentmanager-ed707` (already exists — `src/lib/firebase.ts` is already written, just needs activation)
- **Services to enable in Firebase Console:** Authentication, Firestore, Storage, Cloud Functions, Hosting, Cloud Scheduler

### 3.2 Environment Variables

**Frontend `.env` — replace Supabase vars with Firebase vars:**
```bash
# REMOVE (Supabase — delete these):
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=

# ADD (Firebase — all public, safe to have in repo without values):
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=contentmanager-ed707.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=contentmanager-ed707
VITE_FIREBASE_STORAGE_BUCKET=contentmanager-ed707.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Cloud Function secrets — set via CLI, never in .env:**
```bash
firebase functions:secrets:set LOVABLE_API_KEY      # existing — preserve
firebase functions:secrets:set LINKEDIN_CLIENT_ID
firebase functions:secrets:set LINKEDIN_CLIENT_SECRET
firebase functions:secrets:set RESEND_API_KEY       # Sprint 6
```

### 3.3 Activated `src/lib/firebase.ts`
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
```

### 3.4 Firebase Config Files (add to repo root)
```
firebase.json              ← hosting + functions + firestore + storage config
.firebaserc                ← project alias { "projects": { "default": "contentmanager-ed707" } }
firestore.rules            ← security rules
firestore.indexes.json     ← composite indexes (start empty: { "indexes": [] })
storage.rules              ← storage security rules
```

---

## 4. Firestore Data Model

Firestore is **schemaless — no migrations needed**. Structure is defined by TypeScript types and enforced by security rules. All data is nested under the authenticated user's Firebase UID.

### 4.1 Collection Structure

```
users/{uid}                           Root user document
  ├── displayName: string
  ├── email: string
  ├── photoURL?: string
  ├── industry: string
  ├── jobTitle: string
  ├── company?: string
  ├── experienceRange: string
  ├── location: string
  ├── futureGoal: string
  ├── linkedinUrl?: string
  ├── topics: string[]
  ├── postsPerWeek: number
  ├── preferredDays: string[]
  ├── tone: string
  ├── onboardingCompleted: boolean
  ├── notificationPreferences: { reminderBeforePost, weeklyDigest, publishConfirmation, engagementMilestones }
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp

users/{uid}/persona/main              Single persona document per user
  ├── archetype: string               (Oracle | Builder | Connector)
  ├── contentPillars: Pillar[]
  ├── postingRhythm: PostingRhythm
  ├── voiceProfile: VoiceProfile
  ├── admiredPosts: AdmiredPost[]
  ├── noGoTopic?: string
  ├── generatedAt: Timestamp
  ├── version: number
  └── isActive: boolean

users/{uid}/posts/{postId}            Posts subcollection
  ├── title: string
  ├── content: string
  ├── status: string                  (draft|final|scheduled|published|publish_failed)
  ├── topic?: string
  ├── tone?: string
  ├── instructions?: string
  ├── postLength?: string             (short|medium|long)
  ├── hashtags?: string[]
  ├── versions?: Version[]            (array of version snapshot objects)
  ├── scheduledAt?: Timestamp
  ├── publishedAt?: Timestamp
  ├── linkedinPostId?: string
  ├── sourceInspirationUrl?: string
  ├── performanceData?: object
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp

users/{uid}/chatMessages/{msgId}      PR Agent chat history
  ├── role: string                    (user | assistant)
  ├── content: string
  └── createdAt: Timestamp

users/{uid}/linkedinAccount/main      LinkedIn OAuth connection (single doc)
  ├── linkedinMemberId: string
  ├── accessTokenEncrypted: string    (AES-256 encrypted)
  ├── refreshTokenEncrypted: string
  ├── tokenExpiresAt: Timestamp
  ├── scopes: string[]
  ├── connectedAt: Timestamp
  ├── lastRefreshedAt: Timestamp
  └── isActive: boolean

users/{uid}/postAnalytics/{id}        LinkedIn post performance metrics
  ├── postId: string
  ├── impressions: number
  ├── reactions: number
  ├── comments: number
  ├── shares: number
  ├── clicks: number
  ├── engagementRate: number
  ├── fetchPeriod: string             (24h|48h|7d|14d|30d|manual)
  └── fetchedAt: Timestamp

users/{uid}/engagements/{id}          Comment drafting sessions
  ├── sourcePostUrl?: string
  ├── sourcePostText: string
  ├── sourceAuthor?: string
  ├── commentOptions: CommentOption[]
  ├── selectedComment?: string
  ├── postedAt?: Timestamp
  └── createdAt: Timestamp

users/{uid}/inspirations/{id}         Inspiration library
  ├── sourceUrl?: string
  ├── sourceText: string
  ├── sourceAuthor?: string
  ├── screenshotUrl?: string
  ├── note?: string
  ├── tags: string[]
  ├── type: string                    (inspiration | taste_sample)
  └── savedAt: Timestamp

users/{uid}/extensionEvents/{id}      Weekly behavioral signals from extension
  ├── weekStarting: string            (ISO date YYYY-MM-DD)
  ├── topTopics: string[]
  ├── engagementStyle: string
  ├── postsScanned: number
  ├── commentsDrafted: number
  ├── draftsCaptured: number
  └── syncedAt: Timestamp
```

### 4.2 TypeScript Types (update `src/lib/types.ts`)

```typescript
import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  industry: string;
  jobTitle: string;
  company?: string;
  experienceRange: string;
  location: string;
  futureGoal: string;
  linkedinUrl?: string;
  topics: string[];
  postsPerWeek: number;
  preferredDays: string[];
  tone: string;
  onboardingCompleted: boolean;
  notificationPreferences: NotificationPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Post {
  id?: string;
  title: string;
  content: string;
  status: 'draft' | 'final' | 'scheduled' | 'published' | 'publish_failed';
  topic?: string;
  tone?: string;
  instructions?: string;
  postLength?: 'short' | 'medium' | 'long';
  hashtags?: string[];
  versions?: Version[];
  scheduledAt?: Timestamp | null;
  publishedAt?: Timestamp | null;
  linkedinPostId?: string | null;
  sourceInspirationUrl?: string | null;
  performanceData?: object | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Version {
  versionNumber: number;
  content: string;
  title: string;
  hashtags: string[];
  generatedAt: string;
  modelUsed: string;
  instructionsUsed: string;
}

export interface Persona {
  archetype: 'Oracle' | 'Builder' | 'Connector';
  contentPillars: Pillar[];
  postingRhythm: PostingRhythm;
  voiceProfile: VoiceProfile;
  admiredPosts?: AdmiredPost[];
  noGoTopic?: string;
  generatedAt: Timestamp;
  version: number;
  isActive: boolean;
}

export interface CommentOption {
  approach: string;
  comment: string;
  characterCount: number;
}

export interface Inspiration {
  id?: string;
  sourceUrl?: string;
  sourceText: string;
  sourceAuthor?: string;
  screenshotUrl?: string;
  note?: string;
  tags: string[];
  type: 'inspiration' | 'taste_sample';
  savedAt: Timestamp;
}

export interface NotificationPreferences {
  reminderBeforePost: boolean;
  weeklyDigest: boolean;
  publishConfirmation: boolean;
  engagementMilestones: boolean;
}
```

---

## 5. Firestore Security Rules

**File:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /persona/{doc} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /posts/{postId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /chatMessages/{msgId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /linkedinAccount/{doc} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /postAnalytics/{id} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /engagements/{id} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /inspirations/{id} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      match /extensionEvents/{id} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

---

## 6. Firebase Storage Rules

**File:** `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /admiredPosts/{uid}/{filename} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /inspirations/{uid}/{filename} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /tasteSamples/{uid}/{filename} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## 7. Cloud Functions Architecture

All functions are **2nd gen** (Cloud Run backed). This is required for:
- SSE streaming (prAgentChat)
- Higher timeout limits (up to 3600s)
- Concurrent request handling

### 7.1 Folder Structure

```
functions/
  package.json
  tsconfig.json
  src/
    index.ts                         exports all functions
    middleware/
      verifyToken.ts                 shared Firebase ID token verification
    ai/
      generateContent.ts             ports generate-content (Deno → Node.js)
      personaAgent.ts                ports persona-agent (Deno → Node.js)
      prAgentChat.ts                 ports pr-agent-chat — STREAMING, highest risk
      generateCommentOptions.ts      new: persona-aware comment drafting
      generateDraftFromCapture.ts    new: extension quick-capture draft
    linkedin/
      oauthInit.ts                   new: PKCE initiation
      oauthCallback.ts               new: token exchange + encryption
      publishPost.ts                 new: LinkedIn UGC Posts API
      fetchAnalytics.ts              new: post performance metrics
      importPosts.ts                 new: import existing LinkedIn posts
      refreshToken.ts                new: token refresh scheduler
    notifications/
      sendEmail.ts                   new: Resend integration (Sprint 6)
    scheduler/
      publishScheduledPosts.ts       new: auto-publish cron (every 5 min)
      fetchScheduledAnalytics.ts     new: analytics fetch cron
    utils/
      encryptDecrypt.ts              AES-256 for LinkedIn tokens
      geminiClient.ts                shared Gemini/Lovable gateway client
      corsConfig.ts                  shared CORS setup
```

### 7.2 Shared Auth Middleware

```typescript
// functions/src/middleware/verifyToken.ts
import * as admin from 'firebase-admin';

export async function verifyToken(req: any): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const idToken = authHeader.split('Bearer ')[1];
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded.uid;
}
```

**Frontend — send Firebase ID token with every Cloud Function call:**
```typescript
const idToken = await getAuth().currentUser?.getIdToken();
const res = await fetch(CLOUD_FUNCTION_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  },
  body: JSON.stringify(payload),
});
```

### 7.3 Function Specifications

#### generateContent
```
Method: HTTPS POST | Runtime: Node.js 20 | Memory: 256MB | Timeout: 60s
Auth: Firebase ID token
Input:  { topic, tone, postLength, instructions, hashtagsEnabled, previousDraft?, feedback? }
Steps:
  1. verifyToken(req) → uid
  2. db.doc(`users/${uid}/persona/main`).get() → persona context
  3. db.collection(`users/${uid}/inspirations`).limit(10).get() → inspiration context
  4. POST to ai.gateway.lovable.dev with persona + inspirations + inputs (LOVABLE_API_KEY secret)
  5. Return { title, content, hashtags }
  Note: version appending done client-side via Firestore updateDoc
```

#### personaAgent
```
Method: HTTPS POST | Runtime: Node.js 20 | Memory: 256MB | Timeout: 120s
Auth: Firebase ID token
Input:  { onboardingData: OnboardingPayload }
Steps:
  1. verifyToken(req) → uid
  2. POST to Gemini with onboarding data
  3. db.doc(`users/${uid}/persona/main`).set(parsedPersona)
  4. db.doc(`users/${uid}`).update({ onboardingCompleted: true, ...profileFields })
  5. Return { persona: Persona }
```

#### prAgentChat  ⚠️ HIGHEST COMPLEXITY
```
Method: HTTPS POST | Runtime: Node.js 20 (2nd gen) | Memory: 512MB | Timeout: 300s
Auth: Firebase ID token
Input:  { message: string, conversationHistory: ChatMessage[] }
Steps:
  1. verifyToken(req) → uid
  2. db.doc(`users/${uid}/persona/main`).get() → persona context
  3. Set res headers: Content-Type: text/event-stream, Transfer-Encoding: chunked
  4. POST to Gemini streaming endpoint with persona + history + message
  5. Pipe response chunks to client via res.write(`data: ${chunk}\n\n`)
  6. On stream end: res.write('data: [DONE]\n\n'), res.end()
  7. db.collection(`users/${uid}/chatMessages`).add(userMessage)
  8. db.collection(`users/${uid}/chatMessages`).add(fullAssistantMessage)
  Note: Must use Cloud Functions 2nd gen. Do not write to Firestore until stream completes.
```

#### generateCommentOptions
```
Method: HTTPS POST | Runtime: Node.js 20 | Memory: 256MB | Timeout: 30s
Auth: Firebase ID token
Input:  { sourcePostText: string, sourcePostUrl?: string }
Steps:
  1. verifyToken(req) → uid
  2. db.doc(`users/${uid}/persona/main`).get() → persona + voiceProfile
  3. Gemini prompt: generate exactly 3 comment options:
     - agree-and-extend: adds complementary insight
     - clarifying-question: asks thoughtful follow-up
     - respectful-challenge: offers different perspective
  4. Each comment: max 200 words, in user's voice, no "Great post!" openers
  5. Return { options: [{ approach, comment, characterCount }] }
  Constraint: all comments < 1,250 chars (LinkedIn limit)
```

#### linkedinPublishPost
```
Method: HTTPS POST | Runtime: Node.js 20 | Memory: 256MB | Timeout: 30s
Auth: Firebase ID token
Input:  { postId: string }
Steps:
  1. verifyToken(req) → uid
  2. db.doc(`users/${uid}/posts/${postId}`).get() → post content + hashtags
  3. db.doc(`users/${uid}/linkedinAccount/main`).get() → encrypted token
  4. decrypt(accessToken) using encryptDecrypt utility
  5. POST to LinkedIn /v2/ugcPosts with content
  6. On success: db update post → status: 'published', linkedinPostId, publishedAt
  7. On failure: db update post → status: 'publish_failed', error in performanceData
  8. Return { success, linkedinPostId?, error? }
  Security: token decrypted in memory only — never logged or returned to client
```

#### linkedinFetchAnalytics
```
Method: HTTPS POST (manual) + Cloud Scheduler (automated)
Input:  { postId: string, fetchPeriod: string, uid?: string }
Steps:
  1. Verify Firebase ID token (manual) OR use admin SDK (scheduled)
  2. db.doc(`users/${uid}/posts/${postId}`).get() → linkedinPostId
  3. GET LinkedIn /v2/organizationalEntityShareStatistics?q=organizationalEntity&...
  4. Parse: impressions, reactions, comments, shares, clicks
  5. engagementRate = (reactions + comments + shares) / impressions * 100
  6. db.collection(`users/${uid}/postAnalytics`).add(metrics)
  7. Return { metrics }
  Rate limiting: exponential backoff on LinkedIn 429 — 1s, 2s, 4s, 8s
```

### 7.4 Cloud Scheduler Jobs

| Job Name | Schedule (cron) | Function | Purpose |
|----------|----------------|---------|---------|
| publish-scheduled-posts | `*/5 * * * *` | publishScheduledPosts | Auto-publish where scheduledAt ≤ now() |
| linkedin-token-refresh | `*/30 * * * *` | refreshLinkedinTokens | Refresh tokens expiring within 1 hour |
| linkedin-analytics-24h | Triggered on publish +24h | fetchScheduledAnalytics | 24h metrics fetch |
| linkedin-analytics-7d | Triggered on publish +7d | fetchScheduledAnalytics | 7d metrics fetch |
| linkedin-analytics-30d | Triggered on publish +30d | fetchScheduledAnalytics | 30d metrics fetch |
| weekly-digest-email | `0 8 * * 1` | sendWeeklyDigest | Monday 8am UTC digest |

---

## 8. Authentication Architecture

### 8.1 Auth Service (replace `src/features/auth/authService.ts` entirely)

```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signInWithGoogle = () =>
  signInWithPopup(auth, googleProvider);

export const logOut = () => signOut(auth);

export const onAuthChange = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb);
```

### 8.2 App.tsx Auth Listener (replace Supabase listener)

```typescript
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const onboardingCompleted = snap.data()?.onboardingCompleted ?? false;
      setAuthState({ user, onboardingCompleted, loading: false });
    } else {
      setAuthState({ user: null, onboardingCompleted: false, loading: false });
    }
  });
  return () => unsubscribe();
}, []);
```

### 8.3 Chrome Extension Auth Sharing

```typescript
// Web app login success → write Firebase ID token to extension storage
const idToken = await user.getIdToken();
await chrome.storage.local.set({
  lb_firebase_token: idToken,
  lb_uid: user.uid,
  lb_token_expiry: Date.now() + 3600000  // 1 hour
});

// Web app logout → clear extension storage
await chrome.storage.local.remove(['lb_firebase_token', 'lb_uid', 'lb_token_expiry']);

// Extension → refresh token before expiry
const { lb_token_expiry } = await chrome.storage.local.get('lb_token_expiry');
if (Date.now() > lb_token_expiry - 300000) {  // 5 min before expiry
  // Token needs refresh — prompt user to re-open web app
}
```

---

## 9. Data Service Migration Map

### 9.1 File Actions

| File | Action | Replacement Pattern |
|------|--------|-------------------|
| `src/integrations/supabase/client.ts` | **DELETE** | `src/lib/firebase.ts` |
| `src/integrations/supabase/types.ts` | **DELETE** | `src/lib/types.ts` |
| `src/features/auth/authService.ts` | **REPLACE** | Firebase Auth SDK (Section 8.1) |
| `src/features/profile/profileService.ts` | **REPLACE** | Firestore `getDoc/setDoc/updateDoc` on `users/{uid}` |
| `src/features/generator/contentService.ts` | **REPLACE** | Firestore subcollection `users/{uid}/posts` — add all missing fields |
| `src/features/profile/PrAgentChat.tsx` | **PARTIAL** — replace 3 Supabase calls, keep SSE fetch | Firestore chatMessages subcollection |
| `src/features/profile/PersonaDisplay.tsx` | **PARTIAL** — replace 2 Supabase calls | Firestore `users/{uid}/persona/main` |
| `src/features/onboarding/StepTwo.tsx` | **PARTIAL** — replace storage upload | Firebase Storage `admiredPosts/{uid}/{filename}` |
| `src/lib/firebase.ts` | **ACTIVATE** | Already written — add exports (Section 3.3) |

### 9.2 What Does NOT Change

These files require **zero modifications**:
- All UI components JSX in `src/components/` and `src/features/*/`
- Routing structure (`App.tsx` routes)
- Tailwind config, CSS, design tokens
- Vite config (`vite.config.ts`)
- React Query setup
- shadcn/ui components
- AI gateway URL and Gemini model parameters (just ported to Node.js runtime)
- SSE streaming fetch/ReadableStream logic in `PrAgentChat.tsx`
- `lib/types.ts` interfaces (extend, do not replace)

---

## 10. Storage Migration

### 10.1 Replace Supabase Storage Upload in `StepTwo.tsx`

```typescript
// BEFORE (Supabase):
// const { data, error } = await supabase.storage
//   .from('admired-posts')
//   .upload(`${userId}/${filename}`, file);

// AFTER (Firebase Storage):
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

const uid = getAuth().currentUser?.uid;
const storageRef = ref(storage, `admiredPosts/${uid}/${filename}`);
await uploadBytes(storageRef, file);
const downloadURL = await getDownloadURL(storageRef);
// Store downloadURL in persona admiredPosts array
```

---

## 11. Migration Execution Order

Complete these steps **before Sprint 1 feature work begins**. These are infrastructure steps, not user stories. Claude Code should execute them as Sprint 0.

```
SPRINT 0 — Firebase Migration (infrastructure only)

Step 0.1  firebase login && firebase use contentmanager-ed707
Step 0.2  Enable in Firebase Console: Auth, Firestore, Storage, Functions, Scheduler
Step 0.3  Update .env — remove Supabase vars, add Firebase vars (get from Firebase Console)
Step 0.4  Activate src/lib/firebase.ts (Section 3.3)
Step 0.5  npm uninstall @supabase/supabase-js

Step 1.1  Replace src/features/auth/authService.ts (Section 8.1)
Step 1.2  Replace auth listener in App.tsx (Section 8.2)
Step 1.3  Remove hardcoded test credentials from LoginPage.tsx
Step 1.4  TEST: sign up, sign in, Google OAuth, sign out all work

Step 2.1  Delete src/integrations/supabase/ folder
Step 2.2  Replace profileService.ts with Firestore reads/writes
Step 2.3  Replace contentService.ts — add all missing fields (no migration needed — Firestore is schemaless)
Step 2.4  Replace chatMessages calls in PrAgentChat.tsx
Step 2.5  Replace persona read in PersonaDisplay.tsx
Step 2.6  TEST: create post, load posts, persona display, chat history all work

Step 3.1  Replace Supabase storage upload in StepTwo.tsx with Firebase Storage (Section 10.1)
Step 3.2  Deploy storage rules: firebase deploy --only storage
Step 3.3  TEST: image upload in onboarding works, file visible in Firebase Storage console

Step 4.1  mkdir functions && firebase init functions (Node.js 20, TypeScript)
Step 4.2  Port generate-content → functions/src/ai/generateContent.ts
Step 4.3  Port persona-agent → functions/src/ai/personaAgent.ts
Step 4.4  Port pr-agent-chat → functions/src/ai/prAgentChat.ts (2nd gen, streaming — see spec Section 7.3)
Step 4.5  firebase functions:secrets:set LOVABLE_API_KEY (use existing key value)
Step 4.6  firebase deploy --only functions
Step 4.7  Update Cloud Function URLs in frontend (replace Supabase Edge Function URLs)
Step 4.8  TEST: onboarding → persona generation works, content generation works, PR agent chat streams

Step 5.1  Deploy Firestore rules: firebase deploy --only firestore:rules
Step 5.2  TEST: user cannot read another user's data (verify in Firebase Console rules simulator)

Step 6 — Final verification
Step 6.1  Full onboarding flow end-to-end
Step 6.2  Content generation with persona context
Step 6.3  PR agent chat with streaming
Step 6.4  Zero Supabase calls in browser Network tab
Step 6.5  All data visible in Firebase Console (Firestore + Storage)
```

---

## 12. LinkedIn API Integration (Unchanged from v1.0)

### 12.1 Required OAuth Scopes
| Scope | Purpose |
|-------|---------|
| `w_member_social` | Post on behalf of user |
| `r_liteprofile` | Read basic profile info |
| `r_emailaddress` | Read email address |
| `r_organization_social` | Read post analytics |

### 12.2 Key Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v2/ugcPosts` | POST | Publish a post |
| `/v2/shares` | GET | Retrieve user's posts (import) |
| `/v2/organizationalEntityShareStatistics` | GET | Post analytics |
| `/v2/me` | GET | Get LinkedIn member ID on connect |

### 12.3 Token Security
- Tokens encrypted AES-256 in `encryptDecrypt.ts` Cloud Function utility
- Encryption key stored in Cloud Functions secret (not in Firestore)
- Tokens never returned to client — all LinkedIn calls server-side only
- Token refresh via Cloud Scheduler every 30 minutes

---

## 13. Security Requirements

| Requirement | Implementation |
|------------|---------------|
| User data isolation | Firestore security rules — `request.auth.uid == uid` on all paths |
| LinkedIn tokens client-side | Never — all LinkedIn calls via Cloud Functions using Admin SDK |
| Token encryption | AES-256 in Cloud Function — key in Firebase Secret Manager |
| Firebase ID token verification | Every Cloud Function verifies Bearer token before any processing |
| No secrets in frontend | All secrets via `firebase functions:secrets:set` |
| Storage isolation | Storage rules — user reads/writes own `{uid}/` path only |
| Extension local data | Raw behavioral signals never sent — only abstracted weekly summaries |
| User data deletion | Cloud Function cascade deletes all subcollections + storage + auth.deleteUser() |

---

## 14. Performance Requirements

| Requirement | Target |
|------------|--------|
| Page load (web app) | < 2 seconds on 4G |
| Content generation | < 5 seconds |
| Comment suggestions | < 3 seconds |
| Post badge injection (extension) | < 200ms |
| LinkedIn publish Cloud Function | < 5 seconds |
| prAgentChat first chunk (streaming) | < 1 second |
| Firestore single doc read | < 200ms |
| Firestore collection query | < 500ms |
