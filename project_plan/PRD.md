# Product Requirements Document (PRD)
## LinkedBloom Scribe — Agentic Personal Branding Platform
**Version:** 1.1 | **Date:** May 2026 | **Owner:** Sourav Bhat | **Status:** Approved
**Change from v1.0:** Backend references updated from Supabase/Postgres to Firebase/Firestore to match TRD v2.0.

---

## 1. Product Vision

> "Your always-on AI PR agent — one that genuinely sounds like you, learns from how you work, and helps you own your professional space on LinkedIn without ever posting something you wouldn't stand behind."

---

## 2. User Personas

### 2.1 Primary — "The Builder Developer"
- **Profile:** Senior Software Engineer, 8 years experience
- **Goal:** Build thought leadership in distributed systems / backend engineering
- **Pain:** Ships great work but never has time to write about it; LinkedIn posts feel performative
- **Behaviour:** Reads LinkedIn daily, rarely posts, comments occasionally
- **Success:** 2–4 quality posts/month that sound authentically like them, growing audience of peers

### 2.2 Secondary — "The Transitioning PM"
- **Profile:** Product Manager moving from IC to leadership track
- **Goal:** Position as a strategic voice, attract senior roles
- **Pain:** Has opinions but doesn't know how to frame them as thought leadership
- **Success:** Consistent presence building credibility with recruiters and peers

---

## 3. Feature Overview

### Epic 1: Platform Foundation Fixes (P0)
Fix critical broken functionality that blocks all other features.

### Epic 2: LinkedIn Integration (P1)
OAuth connection, post publishing, performance analytics import.

### Epic 3: Analytics Dashboard (P1)
Real metrics replacing mock data; per-post analytics; engagement trends.

### Epic 4: Engagement Intelligence (P2)
Comment drafting, inspiration library, feed insights.

### Epic 5: Chrome Extension (P3)
Manifest V3 extension with feed monitoring, comment overlay, quick draft capture.

### Epic 6: Persona Intelligence Maturity (P4)
30-day refresh flow, taste intake (sample content/images/video), behavioral persona enrichment.

### Epic 7: Platform Maturity (P4)
Settings page, notifications, content templates, post import, mobile layout.

---

## 4. Detailed Feature Requirements

---

### EPIC 1: Platform Foundation Fixes

#### Feature 1.1 — Posts Data Model Completeness
**Problem:** hashtags, topic, tone, instructions, postLength, versions fields exist in app code but contentService doesn't write/read them to/from Firestore.
**Requirement:** Firestore `posts` subcollection documents and the `Post` TypeScript type cover every field the app actually uses.

**Acceptance Criteria:**
- `users/{uid}/posts/{postId}` documents support: hashtags (string[]), topic (string), tone (string), instructions (string), postLength (string), versions (array), scheduledAt (Timestamp), publishedAt (Timestamp), linkedinPostId (string), performanceData (object)
- contentService reads and writes all fields without data loss
- Existing post documents are unaffected — Firestore is schemaless, so no migration step is needed; new fields simply start being written
- Firestore security rules confirmed to cover the full `posts` subcollection path

#### Feature 1.2 — Calendar Wired to Real Data
**Problem:** Calendar uses hardcoded mock data. Schedule/reschedule/delete do not persist.
**Requirement:** Calendar reads from and writes to the Firestore `users/{uid}/posts` subcollection in real time.

**Acceptance Criteria:**
- Calendar displays all posts with status draft/scheduled/published from DB
- Scheduling a post sets scheduled_at in DB and updates post status to 'scheduled'
- Rescheduling updates scheduled_at; UI reflects change immediately
- Deleting a scheduled post removes it from DB with confirmation dialog
- Empty state shown when no posts exist

#### Feature 1.3 — Settings Route and Page
**Problem:** Sidebar /settings link returns 404.
**Requirement:** Settings page exists with profile, API keys, notification preferences, and danger zone.

**Acceptance Criteria:**
- /settings route renders without 404
- Profile section: edit name, title, industry, location, LinkedIn URL
- API Keys section: save/update/delete Gemini and OpenAI keys with masked display
- Notification preferences: toggle email reminders for scheduled posts
- Danger Zone: "Delete all my data" button with two-step confirmation
- All settings changes persist to the user's Firestore document on save

#### Feature 1.4 — Version History Persistence
**Problem:** Version history tracked in React state only; lost on page refresh.
**Requirement:** Every draft version is persisted to DB.

**Acceptance Criteria:**
- Each generate or regenerate action appends a new version object to the versions array on the post document
- Version object contains: versionNumber, content, title, hashtags, generatedAt, modelUsed, instructionsUsed
- ContentPreview shows version history list with timestamps
- User can restore any previous version with one click
- Restoring a version creates a new version entry (non-destructive)
- Version count badge shown on post cards in drafts list

---

### EPIC 2: LinkedIn Integration

#### Feature 2.1 — LinkedIn OAuth Connection
**Problem:** linkedinService.ts / LinkedInConnect.tsx exist as stubs with no real OAuth flow.
**Requirement:** Full OAuth 2.0 PKCE flow connecting user's LinkedIn account.

**Acceptance Criteria:**
- "Connect LinkedIn" button initiates OAuth 2.0 PKCE flow
- User is redirected to LinkedIn authorization page with correct scopes: w_member_social, r_liteprofile, r_emailaddress, r_organization_social
- On successful auth, access token and refresh token stored encrypted in the `users/{uid}/linkedinAccount/main` Firestore document
- Connection status shown in Settings and dashboard header
- "Disconnect LinkedIn" removes tokens from DB
- Token refresh handled automatically when access token expires
- Error states handled: user denies permission, token expired, revoked access
- New Firestore document: `users/{uid}/linkedinAccount/main` (linkedinMemberId, accessTokenEncrypted, refreshTokenEncrypted, tokenExpiresAt, scopes, connectedAt, lastRefreshedAt, isActive)

#### Feature 2.2 — Post Publishing to LinkedIn
**Problem:** Posts reach "published" status in DB but are never sent to LinkedIn.
**Requirement:** One-click publish from content review page sends post to LinkedIn via API.

**Acceptance Criteria:**
- "Publish to LinkedIn" button visible on posts with status 'final' or 'scheduled'
- Button disabled with tooltip if LinkedIn not connected
- Clicking publish calls a Cloud Function → LinkedIn Share API (UGC Posts endpoint)
- On success: post status updated to 'published', linkedinPostId stored, publishedAt timestamp set
- On failure: error message shown, status remains unchanged, error logged to post document
- Scheduled posts auto-publish via a Cloud Scheduler-triggered Cloud Function at scheduledAt time
- Published posts show LinkedIn icon and "View on LinkedIn" link opening in new tab
- Hashtags included in LinkedIn post body as per LinkedIn API requirements

#### Feature 2.3 — Post Performance Import
**Problem:** No LinkedIn metrics imported; dashboard shows only internal draft counts.
**Requirement:** After publishing, import and store LinkedIn post performance data.

**Acceptance Criteria:**
- New Firestore subcollection: `users/{uid}/postAnalytics/{id}` (postId, impressions, reactions, comments, shares, clicks, engagementRate, fetchPeriod, fetchedAt)
- Performance data fetched 24h, 48h, 7d, 14d, 30d after publishing
- Cloud Function fetches metrics from LinkedIn Analytics API and writes to postAnalytics
- Manual "Refresh metrics" button on published post view
- Engagement rate calculated as: (reactions + comments + shares) / impressions × 100
- Historical performance data retained (multiple fetches per post stored)
- Rate limit handling: exponential backoff on LinkedIn API 429 responses

---

### EPIC 3: Analytics Dashboard

#### Feature 3.1 — Real Metrics Dashboard
**Problem:** Dashboard KPIs show internal draft counts, not LinkedIn performance.
**Requirement:** Dashboard displays real LinkedIn performance metrics aggregated across all published posts.

**Acceptance Criteria:**
- KPI cards: Total Impressions (30d), Total Reactions (30d), Avg Engagement Rate (30d), Posts Published (30d)
- Trend indicators on each KPI: up/down vs previous 30d period
- Top performing post card: highest engagement rate post with preview and metrics
- All data sourced from the postAnalytics subcollection, not mock data
- Empty state with guidance shown when no published posts exist
- Data refreshes on page load; manual refresh button available

#### Feature 3.2 — Per-Post Analytics View
**Problem:** No per-post performance data visible.
**Requirement:** Each published post has a detailed analytics view.

**Acceptance Criteria:**
- Analytics tab on post review page showing: impressions, reactions, comments, shares, clicks, engagement rate
- Engagement timeline chart: metrics at 24h, 48h, 7d, 14d, 30d snapshots
- Comparison to user's own average engagement rate
- "What worked" AI insight: one-sentence analysis of why this post performed as it did (Gemini call using post content + metrics)
- Export metrics as CSV for individual post

#### Feature 3.3 — Engagement Trends Page
**Problem:** No view of performance trends over time.
**Requirement:** Dedicated analytics page showing trends across all posts.

**Acceptance Criteria:**
- Line chart: impressions over time (last 90 days, per post plotted)
- Bar chart: reactions by content topic/pillar
- Best performing post format breakdown: short vs medium vs long
- Best performing tone breakdown across published posts
- Best day/time to post based on actual engagement data (not AI guess)
- Minimum 3 published posts required before trends page shows meaningful data; otherwise shows progress state

---

### EPIC 4: Engagement Intelligence

#### Feature 4.1 — Comment Drafting Tool
**Problem:** No way to draft AI-assisted comments on others' LinkedIn posts.
**Requirement:** Given a LinkedIn post URL or pasted text, generate 3 on-brand comment options.

**Acceptance Criteria:**
- New route /engage or modal accessible from dashboard
- Input: paste LinkedIn post URL or paste post text directly
- On submit: Gemini generates 3 comment options, each with different approach (agree-and-extend, question, contrarian-respectful)
- Each comment option: max 3 sentences, persona-aware (uses user's voice profile), no generic filler phrases
- User can edit any option inline before copying
- "Copy to clipboard" button on each option
- One-click "Save as draft engagement" stores comment + source post URL to the engagements subcollection
- New Firestore subcollection: `users/{uid}/engagements/{id}` (sourcePostUrl, sourcePostText, commentOptions, selectedComment, postedAt, createdAt)
- Character count shown (LinkedIn comment limit: 1,250 characters)

#### Feature 4.2 — Inspiration Library
**Problem:** Admired posts captured only during onboarding; no ongoing capture mechanism.
**Requirement:** Ongoing library for saving LinkedIn posts that inspire the user.

**Acceptance Criteria:**
- New route /inspiration with card grid layout
- Add inspiration: paste URL or text, optional screenshot upload, optional personal note/takeaway
- Each inspiration card shows: thumbnail/screenshot, source URL, user note, date saved, topic tag
- User can tag inspirations by topic (free text + auto-suggest from their content pillars)
- Delete inspiration with confirmation
- Search/filter by topic tag or keyword
- New Firestore subcollection: `users/{uid}/inspirations/{id}` (sourceUrl, sourceText, screenshotUrl, note, tags string[], savedAt)
- Firebase Storage path for screenshots (`inspirations/{uid}/{filename}`)
- Inspiration library referenced by persona agent during content generation ("here are posts this user admires")

#### Feature 4.3 — Feed Insights from Inspiration Library
**Problem:** No pattern analysis across saved inspirations to inform content strategy.
**Requirement:** Aggregate analysis of inspiration library surfaced as strategic recommendations.

**Acceptance Criteria:**
- "Insights" tab on /inspiration page (available when ≥5 inspirations saved)
- AI analysis (Gemini) across all saved inspirations identifying: common topics, hook patterns, post formats (list/narrative/question/statement), average post length
- Top 3 "what works in your niche" recommendations displayed as cards
- "Generate a post inspired by these patterns" button → pre-fills content generator with identified patterns
- Insights regenerate when new inspirations are added (triggered by user, not automatic)

---

### EPIC 5: Chrome Extension

#### Feature 5.1 — Extension Scaffold and Auth
**Problem:** No Chrome extension code exists.
**Requirement:** Manifest V3 Chrome extension that shares auth session with the web app.

**Acceptance Criteria:**
- Manifest V3 extension with: background service worker, content script for linkedin.com, popup HTML/JS
- Extension stored in /extension subfolder of repo with its own package.json and build config
- Auth handoff: extension reads Firebase ID token from chrome.storage.local (set by web app on login)
- Popup shows logged-in state (user name, avatar) if session valid; "Open LinkedBloom" CTA if not
- Extension icon shows green dot when active/monitoring, grey when paused
- Permission prompt shown on first install: clear plain-English explanation of what is monitored and what stays local
- User can pause/resume monitoring from popup toggle
- Extension version displayed in popup footer

#### Feature 5.2 — Real-Time Feed Post Detection
**Problem:** No feed monitoring capability.
**Requirement:** Extension detects posts in LinkedIn feed as user scrolls and scores them for engagement opportunity.

**Acceptance Criteria:**
- MutationObserver watches LinkedIn feed DOM for new post nodes
- For each detected post: extract author name, post text (first 300 chars), post URL, reaction count, comment count
- Post scored for engagement opportunity based on: topic relevance to user's pillars, comment count (not too few, not too many — sweet spot 5–50), recency (< 24h preferred)
- High-opportunity posts shown with a subtle LinkedBloom badge overlay (non-intrusive, small icon in post corner)
- Badge tooltip on hover: "Good engagement opportunity — click to draft a comment"
- Badge only shown on posts scoring above threshold — not every post
- All scoring done locally in content script — no post data sent to cloud without user action
- User can dismiss badge on any post (remembered in chrome.storage.local for that session)

#### Feature 5.3 — Comment Drafting Overlay
**Problem:** No in-situ comment drafting on LinkedIn.
**Requirement:** When user clicks the LinkedBloom badge on a post, an overlay appears with AI-generated comment suggestions.

**Acceptance Criteria:**
- Clicking badge opens a non-blocking overlay panel anchored to the post
- Overlay shows: 3 comment suggestions (same logic as Feature 4.1 but triggered from extension)
- Each suggestion: persona-aware, different approach (extend/question/challenge), character count shown
- Overlay calls LinkedBloom API (Cloud Function) with post text + user persona — requires active session
- "Use this comment" inserts the selected comment text into LinkedIn's native comment box
- User can edit the inserted text before posting — extension does not post on user's behalf
- "Regenerate" button fetches 3 new suggestions with different angles
- "Save to inspiration" button saves the source post to inspiration library
- Overlay closes when user clicks outside it or presses Escape
- Loading state shown while API call in progress (≤3 seconds target)
- Overlay works on both desktop LinkedIn feed and post detail pages

#### Feature 5.4 — Quick Draft Capture
**Problem:** No way to capture a LinkedIn post as content inspiration and turn it into a draft.
**Requirement:** One-click capture of a LinkedIn post into the LinkedBloom drafts queue.

**Acceptance Criteria:**
- "Draft from this post" option in LinkedBloom badge context menu on any post
- On click: post text, author, URL captured and sent to LinkedBloom API
- Gemini generates a draft post inspired by (not copying) the captured content, using user's persona
- Draft saved to the posts subcollection with status 'draft', sourceInspirationUrl stored
- Popup notification: "Draft created — review in LinkedBloom" with link
- User must navigate to web app to review, edit, and publish — no in-extension editing
- Capture works on posts, articles, and reposts

#### Feature 5.5 — Transparency Dashboard in Popup
**Problem:** Users need to trust what the extension is collecting.
**Requirement:** Extension popup shows a live transparency feed of what has been collected this session.

**Acceptance Criteria:**
- Popup "Activity" tab shows: posts scanned (count), high-opportunity posts identified (count), comments drafted (count), drafts captured (count) — for current session
- "What we collect" info section: plain-English bullet list of exactly what data is captured locally vs sent to cloud
- "Collected locally, never sent" section: scroll patterns, dwell time, full post text of unactioned posts
- "Sent to cloud only when you act" section: post text when you request comment drafting, captured post when you create a draft
- Toggle to pause all monitoring — immediately stops MutationObserver
- "Clear local data" button purges chrome.storage.local for this extension
- Link to full privacy policy page

---

### EPIC 6: Persona Intelligence Maturity

#### Feature 6.1 — Taste Intake Enrichment
**Problem:** Onboarding captures basic admired posts but no visual aesthetic or video/talk preferences.
**Requirement:** Richer taste intake that captures visual preferences and communication style examples.

**Acceptance Criteria:**
- New "Refine My Taste" section in persona settings
- Upload up to 10 content samples: text posts, articles, images, screenshots
- Each sample: user annotates what they like about it (tone, format, topic, visual style) — free text + suggested tags
- Video/talk URL input: YouTube or LinkedIn video links; system extracts transcript via API for analysis
- Visual aesthetic board: user selects from 12 visual style cards (minimalist, data-heavy, storytelling, etc.)
- All taste samples stored in the inspirations subcollection with type='taste_sample' flag
- Persona agent re-runs with taste samples in context on next scheduled refresh
- Changes to taste intake trigger persona refresh prompt (not automatic — user confirms)

#### Feature 6.2 — 30-Day Persona Refresh Flow
**Problem:** Persona is generated once at onboarding; no refresh mechanism exists despite UI claiming "re-evaluated every 30 days."
**Requirement:** Automated prompt and structured refresh flow every 30 days.

**Acceptance Criteria:**
- 30 days after last persona generation, user sees in-app banner: "Time to refresh your persona — your voice may have evolved"
- Refresh flow: 3–5 conversational questions from PR agent about what's changed (new projects, shifted focus, new opinions)
- Questions are different each refresh — not a static form
- Persona agent re-runs with: original onboarding data + all posts written since last refresh + chat history + new refresh answers
- New persona shown as diff vs previous: what changed, what stayed the same
- User can accept full refresh, accept partial (select which changes to apply), or keep current
- Previous persona version archived (non-destructive) to `users/{uid}/personaHistory/{version}` before the new persona overwrites `persona/main`
- Refresh can be manually triggered at any time from Settings

#### Feature 6.3 — Behavioral Persona Enrichment from Extension
**Problem:** Persona is built from what user says about themselves; behavioral signals from extension not used.
**Requirement:** Extension engagement patterns feed into persona model.

**Acceptance Criteria:**
- Extension tracks locally: topics of posts user lingers on (>5s), topics user comments on, accounts user regularly engages with
- Weekly summary of engagement patterns synced to the `extensionEvents` Firestore subcollection (abstracted, not raw): top 3 topics engaged with, engagement style (question-asker vs opinion-sharer vs information-seeker)
- Persona agent receives behavioral summary alongside stated preferences on next refresh
- Behavioral data shown to user in "What we learned this week" card on dashboard
- User can correct any behavioral inference ("I engaged with these posts out of curiosity, not because it's my focus area")
- Behavioral data collection requires explicit opt-in separate from basic extension monitoring permission

---

### EPIC 7: Platform Maturity

#### Feature 7.1 — Post Reminder Notifications
**Requirement:** Email and in-app reminders for scheduled posts and posting cadence goals.

**Acceptance Criteria:**
- Email reminder 1 hour before a scheduled post's publish time
- Weekly digest email: posts published this week, engagement summary, suggested topics for next week
- In-app notification bell icon with unread count
- Notification types: post reminder, post published confirmation, metrics milestone (first 100 impressions, etc.)
- Notification preferences toggle per type in Settings
- Email sending via a Cloud Function + Resend or SendGrid

#### Feature 7.2 — Content Templates Library
**Requirement:** Pre-built prompt templates for common post types to speed up content generation.

**Acceptance Criteria:**
- /templates route with card grid of template types
- Template categories: lessons learned, project launch, opinion/hot take, tutorial/how-to, career milestone, industry observation, tool review
- Each template: title, description, example post, pre-filled prompt fields
- "Use template" opens content generator with template fields pre-populated
- User can save custom templates from any content generation session
- Templates are persona-aware — same template generates differently for each user

#### Feature 7.3 — LinkedIn Post Import
**Requirement:** Import user's existing LinkedIn posts as baseline for analytics and persona enrichment.

**Acceptance Criteria:**
- "Import LinkedIn posts" option in Settings (requires LinkedIn connected)
- Fetches up to 50 most recent posts from LinkedIn API
- Imported posts stored with source='linkedin_import' flag in the posts subcollection with status='published'
- Import does not duplicate posts already tracked (deduplicated by linkedinPostId)
- Performance metrics fetched for each imported post (impressions, reactions, etc.)
- Imported posts included in analytics dashboard calculations
- Persona agent can reference imported posts as writing samples on next refresh
- Progress indicator shown during import (can take 30–60 seconds)

#### Feature 7.4 — Mobile Layout Polish
**Requirement:** Core flows usable on mobile screen sizes.

**Acceptance Criteria:**
- Sidebar collapses to bottom navigation on screens <768px
- Content generator, draft review, and calendar all functional on mobile
- Touch targets minimum 44×44px
- No horizontal scroll on any core page at 375px viewport width
- Extension-equivalent mobile features deferred (extension is desktop Chrome only)
