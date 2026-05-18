# Technical Requirements Document (TRD)
## LinkedBloom Scribe — Agentic Personal Branding Platform
**Version:** 1.0 | **Date:** May 2026 | **Owner:** Sourav Bhat | **Status:** Approved

---

## 1. Technical Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  React + TypeScript + Vite + Tailwind + shadcn-ui           │
│  ┌──────────────┐    ┌────────────────────────────────────┐  │
│  │  Web App     │    │  Chrome Extension (Manifest V3)    │  │
│  │  (Lovable)   │    │  content script + service worker   │  │
│  └──────────────┘    └────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    BACKEND LAYER (Supabase)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ PostgreSQL  │  │ Edge Functions│  │   Auth (JWT)      │   │
│  │  + RLS      │  │  (Deno)      │  │                   │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐                          │
│  │  Storage    │  │  Realtime    │                          │
│  │  (S3)       │  │  (websocket) │                          │
│  └─────────────┘  └──────────────┘                          │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│  │ Gemini 2.5 │  │ LinkedIn API  │  │  Resend (email)   │   │
│  │    Pro     │  │   v2 REST     │  │                   │   │
│  └────────────┘  └───────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | React | 18.x | UI component tree |
| Language | TypeScript | 5.x | Type safety across all layers |
| Build Tool | Vite | 5.x | Fast HMR dev server + production build |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Component Library | shadcn-ui | latest | Accessible, composable UI components |
| Backend / Auth | Supabase | latest | PostgreSQL, Auth, Edge Functions, Storage, Realtime |
| AI Model | Gemini 2.5 Pro | API | Persona generation, content creation, chat agent |
| Extension Build | Vite + CRXJS | latest | Chrome Manifest V3 extension bundler |
| Email | Resend | latest | Transactional email delivery |
| Package Manager | Bun / npm | latest | Dependency management |
| Hosting | Lovable / Vercel | - | Web app hosting |
| CI/CD | GitHub Actions | - | Automated tests and deployment |

---

## 3. Database Schema

### 3.1 Existing Tables (confirmed in codebase)

#### profiles
```sql
id uuid PRIMARY KEY REFERENCES auth.users
email text
full_name text
industry text
experience_level text
location text
goal text
linkedin_url text
posting_cadence text
tone_preference text
created_at timestamptz
updated_at timestamptz
```

#### personas
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES profiles(id)
archetype text  -- Oracle/Builder/Connector
content_pillars jsonb  -- array of 3 pillar objects
posting_rhythm jsonb
voice_profile jsonb
generated_at timestamptz
is_active boolean
version integer
```

#### posts
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES profiles(id)
title text
content text
status text  -- draft/scheduled/final/published
created_at timestamptz
updated_at timestamptz
```

#### chat_messages
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES profiles(id)
role text  -- user/assistant
content text
created_at timestamptz
```

### 3.2 New Tables Required (migrations to be written)

#### posts (MIGRATION — add columns)
```sql
ALTER TABLE posts ADD COLUMN hashtags text[];
ALTER TABLE posts ADD COLUMN topic text;
ALTER TABLE posts ADD COLUMN tone text;
ALTER TABLE posts ADD COLUMN instructions text;
ALTER TABLE posts ADD COLUMN post_length text;
ALTER TABLE posts ADD COLUMN versions jsonb DEFAULT '[]'::jsonb;
ALTER TABLE posts ADD COLUMN scheduled_at timestamptz;
ALTER TABLE posts ADD COLUMN published_at timestamptz;
ALTER TABLE posts ADD COLUMN linkedin_post_id text;
ALTER TABLE posts ADD COLUMN source_inspiration_url text;
ALTER TABLE posts ADD COLUMN performance_data jsonb;
```

#### linkedin_accounts (NEW)
```sql
CREATE TABLE linkedin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  linkedin_member_id text NOT NULL,
  access_token_encrypted text NOT NULL,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[],
  connected_at timestamptz DEFAULT now(),
  last_refreshed_at timestamptz,
  is_active boolean DEFAULT true
);
CREATE UNIQUE INDEX ON linkedin_accounts(user_id) WHERE is_active = true;
```

#### post_analytics (NEW)
```sql
CREATE TABLE post_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  impressions integer DEFAULT 0,
  reactions integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  clicks integer DEFAULT 0,
  engagement_rate numeric(5,2),
  fetched_at timestamptz DEFAULT now(),
  fetch_period text  -- '24h' | '48h' | '7d' | '14d' | '30d'
);
```

#### engagements (NEW)
```sql
CREATE TABLE engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  source_post_url text,
  source_post_text text,
  source_author text,
  comment_options jsonb,  -- array of 3 generated options
  selected_comment text,
  posted_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

#### inspirations (NEW)
```sql
CREATE TABLE inspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  source_url text,
  source_text text,
  source_author text,
  screenshot_url text,
  note text,
  tags text[],
  type text DEFAULT 'inspiration',  -- 'inspiration' | 'taste_sample'
  saved_at timestamptz DEFAULT now()
);
```

#### extension_events (NEW — local sync of abstracted behavioral data)
```sql
CREATE TABLE extension_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  week_starting date,
  top_topics text[],
  engagement_style text,
  posts_scanned integer,
  comments_drafted integer,
  drafts_captured integer,
  synced_at timestamptz DEFAULT now()
);
```

### 3.3 RLS Policies
All new tables must have Row Level Security enabled with policy:
```sql
ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own data"
ON [table_name] FOR ALL
USING (auth.uid() = user_id);
```

---

## 4. Edge Functions

### Existing Edge Functions
| Function | Purpose | Model |
|----------|---------|-------|
| generate-persona | Generate user archetype, pillars, voice profile | Gemini 2.5 Pro |
| generate-content | Create post draft from topic/tone/instructions | Gemini 2.5 Pro |
| chat-agent | PR agent streaming chat with persona context | Gemini 2.5 Pro |

### New Edge Functions Required

| Function | Trigger | Purpose | Notes |
|----------|---------|---------|-------|
| linkedin-oauth-callback | GET from LinkedIn redirect | Exchange auth code for tokens, store encrypted | PKCE verification |
| linkedin-refresh-token | Cron / on-demand | Refresh expired LinkedIn access tokens | Run 1h before expiry |
| linkedin-publish-post | POST from client | Publish approved post to LinkedIn API | Returns linkedin_post_id |
| linkedin-fetch-analytics | Cron (daily) + manual | Fetch post performance from LinkedIn Analytics API | Per-post, multiple time periods |
| linkedin-import-posts | POST from client | Import up to 50 existing LinkedIn posts | Deduplicate by linkedin_post_id |
| generate-comment-options | POST from client + extension | Generate 3 persona-aware comment options for a given post | Used by both web app and extension |
| generate-draft-from-capture | POST from extension | Generate draft post inspired by captured LinkedIn post | Extension quick-capture feature |
| analyze-inspirations | POST from client | Aggregate analysis of inspiration library | Gemini analysis of all saved inspirations |
| send-notification-email | Triggered by DB event | Send scheduled post reminders and weekly digest | Via Resend API |
| refresh-persona | POST from client | Re-run persona generation with enriched context | Includes chat history, new posts, behavioral summary |
| encrypt-decrypt-token | Internal utility | AES-256 encrypt/decrypt for LinkedIn tokens | Called by other Edge Functions |

---

## 5. Chrome Extension Architecture

### 5.1 Folder Structure
```
/extension
  manifest.json
  /src
    background/
      service-worker.ts       # Background service worker
    content/
      linkedin-feed.ts        # MutationObserver for feed posts
      comment-overlay.ts      # Comment drafting overlay injected UI
      post-detector.ts        # Post scoring and badge injection
    popup/
      popup.html
      popup.ts                # Popup UI logic
      popup.css
    utils/
      auth.ts                 # Supabase session management
      api.ts                  # Calls to LinkedBloom Edge Functions
      storage.ts              # chrome.storage.local wrapper
      scorer.ts               # Local post opportunity scoring
  /public
    icons/                    # 16, 32, 48, 128px icons
  package.json
  vite.config.ts              # CRXJS plugin config
  tsconfig.json
```

### 5.2 Manifest V3 Permissions
```json
{
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["https://www.linkedin.com/*"],
  "content_scripts": [{
    "matches": ["https://www.linkedin.com/*"],
    "js": ["src/content/linkedin-feed.js"],
    "run_at": "document_idle"
  }],
  "background": {
    "service_worker": "src/background/service-worker.js"
  }
}
```

### 5.3 Data Flow — Local vs Cloud
```
LOCAL (chrome.storage.local — never sent to cloud):
  - Scroll patterns and dwell times
  - Full text of posts user does NOT act on
  - Session engagement counts
  - Dismissed badge list

SENT TO CLOUD (only on explicit user action):
  - Post text when user requests comment drafting
  - Post text + URL when user captures a draft
  - Abstracted weekly behavioral summary (topic patterns only)
```

### 5.4 Auth Handoff
```
1. User logs into LinkedBloom web app
2. Web app stores Supabase JWT in chrome.storage.local under key 'lb_session'
3. Extension reads 'lb_session' on load — if valid, user is authenticated
4. Extension API calls include JWT in Authorization header
5. On logout from web app, 'lb_session' is cleared — extension shows logged-out state
```

---

## 6. LinkedIn API Integration

### 6.1 Required OAuth Scopes
| Scope | Purpose |
|-------|---------|
| w_member_social | Post on behalf of user |
| r_liteprofile | Read basic profile info |
| r_emailaddress | Read email address |
| r_organization_social | Read post analytics |

### 6.2 Key API Endpoints Used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /v2/ugcPosts | POST | Publish a post |
| /v2/shares | GET | Retrieve user's posts (import) |
| /v2/organizationalEntityShareStatistics | GET | Post analytics (impressions, reactions, etc.) |
| /v2/socialActions/{shareUrn}/comments | GET | Comment count per post |
| /v2/me | GET | Get LinkedIn member ID on OAuth connect |

### 6.3 Token Storage Security
- Access tokens encrypted with AES-256 before storage in Supabase
- Encryption key stored in Supabase Vault (not in Edge Function env vars)
- Tokens never returned to client — all LinkedIn API calls made server-side via Edge Functions
- Token refresh handled server-side 1 hour before expiry

### 6.4 Rate Limit Handling
- LinkedIn API: 100 calls/day per member for most endpoints
- Implement exponential backoff: 1s → 2s → 4s → 8s on 429 response
- Queue analytics fetch jobs — do not fetch all posts simultaneously
- Cache analytics responses for minimum 6 hours before re-fetching

---

## 7. Security Requirements

| Requirement | Implementation |
|------------|---------------|
| All API keys encrypted at rest | Supabase Vault + AES-256 |
| RLS on all DB tables | Supabase RLS policies — users can only access own rows |
| LinkedIn tokens never exposed to client | All LinkedIn calls via Edge Functions only |
| Extension data transparency | All local data readable by user in popup transparency view |
| HTTPS only | Enforced by Supabase and Lovable/Vercel hosting |
| No raw behavioral data to cloud | Enforced by extension architecture — only abstracted summaries synced |
| User data deletion | Cascade deletes on user_id FK; storage bucket cleanup on account delete |
| PKCE for OAuth | LinkedIn OAuth 2.0 flow uses PKCE — no client secret in browser |

---

## 8. Performance Requirements

| Requirement | Target |
|------------|--------|
| Page load time (web app) | < 2 seconds on 4G |
| Content generation response | < 5 seconds |
| Comment suggestion generation | < 3 seconds (extension overlay) |
| Post badge injection latency | < 200ms per post detected |
| LinkedIn API publish call | < 3 seconds |
| Analytics fetch (background) | Async — no user-blocking |

---

## 9. Development Environment Setup

```bash
# Web App
git clone https://github.com/Sourav-Bhat/linked-bloom-scribe
cd linked-bloom-scribe
npm install
cp .env.example .env  # Fill in Supabase + Gemini keys
npm run dev

# Chrome Extension
cd extension
npm install
npm run dev   # Builds to /extension/dist — load as unpacked in Chrome

# Supabase Migrations
npx supabase db push  # Run all pending migrations
npx supabase functions deploy  # Deploy all Edge Functions
```

---

## 10. Testing Requirements

| Type | Requirement |
|------|------------|
| Unit tests | Edge Functions: each function has a test file covering happy path + error cases |
| Integration tests | LinkedIn OAuth flow tested with mock LinkedIn server |
| E2E tests | Critical flows: onboarding, content generation, publish to LinkedIn |
| Extension testing | Manual testing in Chrome with linkedin.com — automated tests for scoring logic |
| Beta monitoring | Supabase logs + Edge Function logs reviewed weekly |
