# Sprint Execution Guide
## LinkedBloom Scribe — Instructions for Claude Code
**Version:** 1.1 | **Date:** May 2026
**Change from v1.0:** Backend references updated from Supabase/Postgres to Firebase/Firestore to match TRD v2.0.

---

## How to Use This Document

This guide is written for **Claude Code** executing the LinkedBloom Scribe project sprint by sprint. Each sprint section contains:
- Sprint goal
- Ordered list of user stories to implement
- Exact acceptance criteria to meet
- Dependencies to check before starting each story
- Definition of Done checklist

**Rule:** Complete stories in the order listed within each sprint. Do not start a story until its dependencies are done. Do not move to the next sprint until all stories in the current sprint pass their acceptance criteria.

**Reference documents in /project-documents/:**
- `BRD.md` — Business context and rules
- `PRD.md` — Full feature requirements
- `TRD.md` — Technical architecture, Firestore data model, Cloud Function specs
- `BACKLOG.md` — Full user stories with acceptance criteria
- `LinkedBloom_Project_Backlog.xlsx` — Same backlog in spreadsheet format

---

## Universal Definition of Done (All Stories)

Before marking any story complete:
- [ ] Code committed to main branch with descriptive commit message referencing story ID
- [ ] No TypeScript compilation errors (`npx tsc --noEmit` passes)
- [ ] No console errors in browser on affected pages
- [ ] Firestore security rules cover any new collection paths
- [ ] New Cloud Functions deployed to Firebase
- [ ] All acceptance criteria from BACKLOG.md manually verified
- [ ] Responsive layout not broken (test at 1280px and 375px)

---

## SPRINT 1 — Platform Foundation Fixes
**Duration:** Weeks 1–2
**Goal:** Fix all broken/incomplete existing functionality. Zero new features until the foundation is solid. After this sprint, the app must have no 404 routes, no mock data in the calendar, all post fields persisting to DB, and complete settings functionality.

### Story Execution Order

#### 1. US-001 — Posts Data Model Completeness
- Read TRD.md Section 4.1/4.2 for the exact field specifications
- Update `Post` type in `src/lib/types.ts` and Firestore security rules for `users/{uid}/posts/{postId}`
- No migration to run — Firestore is schemaless; verify existing documents are unaffected

#### 2. US-002 — Update contentService
- Depends on: US-001
- Update `src/services/contentService.ts` (or wherever it lives)
- Update TypeScript Post type/interface to include all new fields
- Verify `createPost`, `updatePost`, `getPost`, `getPosts` all handle new fields

#### 3. US-003 — Version History Persistence
- Depends on: US-001, US-002
- Modify the generateContent Cloud Function to append version objects
- Update ContentPreview component to show version list
- Add Restore button functionality

#### 4. US-004 — Calendar Real Data
- Depends on: US-001
- Locate Calendar component, replace `initialScheduledContent` with a Firestore query against `users/{uid}/posts`
- Add loading skeleton and empty state

#### 5. US-005 — Schedule Post from Review Page
- Depends on: US-001, US-004
- Add "Schedule Post" button and date-time picker to post review page
- Wire to a Firestore document update

#### 6. US-006 — Reschedule from Calendar
- Depends on: US-004, US-005
- Add click handler to calendar post items
- Build post detail panel/modal with reschedule flow

#### 7. US-007 — Delete/Unschedule from Calendar
- Depends on: US-004, US-005
- Add "Remove from schedule" and "Delete permanently" to post detail panel

#### 8. US-008 — Settings Route
- Depends on: Nothing
- Add /settings to React Router config
- Build Settings page layout with four section placeholders

#### 9. US-009 — Profile Edit in Settings
- Depends on: US-008
- Build profile form section in Settings, wired to the `users/{uid}` Firestore document

#### 10. US-010 — API Keys in Settings
- Depends on: US-008
- Build API keys section with masked inputs and encryption

#### 11. US-011 — Notification Preferences in Settings
- Depends on: US-008
- Build toggles section, persist to the `notificationPreferences` field on `users/{uid}`

#### 12. US-012 — Danger Zone in Settings
- Depends on: US-008
- Build Danger Zone with cascade delete flow

### Sprint 1 Complete When:
- [ ] Calendar shows real posts from Firestore (no mock data)
- [ ] Scheduling, rescheduling, unscheduling all persist to Firestore
- [ ] /settings loads without 404
- [ ] All settings sections functional (profile, API keys, notifications, danger zone)
- [ ] Post generation saves topic, tone, instructions, hashtags, length to Firestore
- [ ] Version history persists across page refreshes
- [ ] No console errors on any page

---

## SPRINT 2 — LinkedIn Integration
**Duration:** Weeks 3–4
**Goal:** Connect LinkedIn accounts via OAuth, enable post publishing, and set up the analytics data pipeline. After this sprint, beta users can publish posts directly to LinkedIn from the app and begin accumulating performance data.

### Story Execution Order

#### 1. US-013 — linkedinAccount Document
- Define `users/{uid}/linkedinAccount/main` document shape per TRD.md Section 4.1
- Apply Firestore security rules for that path

#### 2. US-014 — LinkedIn OAuth PKCE Flow
- Depends on: US-013
- Read TRD.md Section 12 for LinkedIn API scope details
- Create two Cloud Functions: `oauthInit` and `oauthCallback` (functions/src/linkedin/)
- Create `encryptDecrypt.ts` utility first (called by callback)
- Add /auth/linkedin/callback route to React Router
- Add "Connect LinkedIn" button in Settings
- Test full OAuth flow end to end

#### 3. US-015 — Connection Status Display
- Depends on: US-014
- Update Settings page with LinkedIn connection section
- Update dashboard header with status indicator
- Add disabled state + tooltip to Publish button

#### 4. US-016 — Disconnect LinkedIn
- Depends on: US-015
- Add disconnect button and confirmation modal

#### 5. US-017 — Automatic Token Refresh
- Depends on: US-014
- Create `refreshLinkedinTokens` Cloud Function (functions/src/linkedin/refreshToken.ts)
- Set up a Cloud Scheduler job (every 30 minutes) to trigger it

#### 6. US-022 — postAnalytics Subcollection
- No dependencies — can run in parallel with US-017
- Define `users/{uid}/postAnalytics/{id}` document shape per TRD.md Section 4.1

#### 7. US-018 — linkedinPublishPost Cloud Function
- Depends on: US-014, US-013
- Create Cloud Function that publishes to LinkedIn /v2/ugcPosts
- Test with a real LinkedIn account

#### 8. US-019 — Publish Button on Post Review
- Depends on: US-018, US-015
- Add "Publish to LinkedIn" button to post review page
- Wire confirmation modal, loading state, success/error handling

#### 9. US-020 — Auto-Publish Scheduled Posts
- Depends on: US-018, US-017
- Set up a Cloud Scheduler job querying scheduled posts
- Handle publish_failed status and error storage

#### 10. US-021 — Published Post UI
- Depends on: US-019
- Update post cards and detail view with published state
- Add "View on LinkedIn" link

#### 11. US-023 — fetchAnalytics Cloud Function
- Depends on: US-022, US-014
- Create analytics fetch Cloud Function with backoff handling

#### 12. US-024 — Scheduled Analytics Fetches
- Depends on: US-023, US-019
- Set up 5 scheduled jobs per post publish event

#### 13. US-025 — Manual Refresh Metrics Button
- Depends on: US-023
- Add button to published post view with rate limiting

### Sprint 2 Complete When:
- [ ] User can connect LinkedIn account via OAuth
- [ ] User can disconnect and reconnect
- [ ] Tokens refresh automatically before expiry
- [ ] "Publish to LinkedIn" button sends post to LinkedIn
- [ ] Published post shows linkedinPostId and "View on LinkedIn" link
- [ ] Scheduled posts auto-publish via Cloud Scheduler
- [ ] Analytics fetched at defined intervals for published posts

---

## SPRINT 3 — Analytics Dashboard
**Duration:** Weeks 5–6
**Goal:** Replace all mock data with real LinkedIn performance metrics. Build trends page and post import. After this sprint, the dashboard is fully data-driven and beta users can see their LinkedIn performance.

### Story Execution Order

#### 1. US-026 — Real Dashboard KPIs
- Depends on: US-022, US-023
- Replace all mock KPI values with Firestore queries against postAnalytics
- Add trend calculations vs previous 30d

#### 2. US-027 — Top Post Card
- Depends on: US-026
- Add "Top Post This Month" card to dashboard

#### 3. US-028 — Per-Post Analytics Tab
- Depends on: US-022, US-023, US-026
- Add Analytics tab to post detail page
- Build engagement timeline table/chart
- Add Gemini "What worked" insight call
- Add CSV export

#### 4. US-029 — Engagement Trends Page
- Depends on: US-026, US-028
- Create /analytics route
- Build all charts with recharts
- Handle <3 posts progress state

#### 5. US-030 — LinkedIn Post Import
- Depends on: US-014, US-023
- Create `importPosts` Cloud Function
- Add "Import LinkedIn posts" button to Settings
- Build progress indicator and result summary

### Sprint 3 Complete When:
- [ ] Dashboard shows real LinkedIn metrics (no mock data anywhere)
- [ ] Per-post analytics tab functional on all published posts
- [ ] /analytics trends page renders all charts with real data
- [ ] LinkedIn post import works and imports appear in analytics

---

## SPRINT 4 — Engagement Intelligence
**Duration:** Weeks 7–8
**Goal:** Build comment drafting, inspiration library, and feed insights — the features that move the platform from a content creation tool to an engagement intelligence platform.

### Story Execution Order

#### 1. US-031 — engagements Subcollection
- Define `users/{uid}/engagements/{id}` document shape and security rules

#### 2. US-034 — inspirations Subcollection + Storage Path
- Define `users/{uid}/inspirations/{id}` document shape and the `inspirations/{uid}/` Storage path
- No dependency on US-031

#### 3. US-032 — generateCommentOptions Cloud Function
- Depends on: US-031
- Create Cloud Function with persona-aware Gemini prompting
- Test with real persona data — verify 3 options returned with correct approaches

#### 4. US-033 — Comment Drafting Page (/engage)
- Depends on: US-032
- Build full /engage page with tabbed input, comment cards, history

#### 5. US-035 — Inspiration Library Page (/inspiration)
- Depends on: US-034
- Build full /inspiration page with add form, card grid, search, filter

#### 6. US-036 — Reference Inspirations in Content Generation
- Depends on: US-034, US-035
- Modify the generateContent Cloud Function to include inspirations context
- Add toggle in content generator UI

#### 7. US-037 — Feed Insights Tab
- Depends on: US-035
- Build Insights tab on /inspiration page
- Create Gemini analysis prompt for inspiration patterns
- Build "Create post from patterns" flow

### Sprint 4 Complete When:
- [ ] /engage page generates 3 persona-aware comment options
- [ ] Comments can be edited, copied, and saved
- [ ] /inspiration library allows adding, searching, and deleting inspirations
- [ ] Inspiration library referenced in content generation
- [ ] Feed insights generated when ≥5 inspirations saved

---

## SPRINT 5 — Chrome Extension
**Duration:** Weeks 9–10
**Goal:** Build the complete Chrome extension — scaffold, feed detection with scoring, comment drafting overlay, quick draft capture, and transparency dashboard.

**Important:** Extension is built in /extension subfolder. It is a separate build from the web app. The web app must be deployed and accessible for the extension to function (session sharing requires the web app to be running).

### Story Execution Order

#### 1. US-038 — Extension Scaffold
- Set up /extension folder with Vite + CRXJS
- Get a working Manifest V3 build that loads in Chrome as unpacked extension
- Verify background service worker and content script load without errors on linkedin.com

#### 2. US-039 — Session Sharing
- Depends on: US-038
- Modify web app login/logout to write/clear chrome.storage.local 'lb_firebase_token'
- Extension popup reads and validates the cached token expiry

#### 3. US-040 — Popup UI
- Depends on: US-039
- Build popup HTML/CSS/TS with all three states (logged-in, paused, logged-out)

#### 4. US-041 — First Install Permissions Page
- Depends on: US-039
- Build welcome page that opens on first install
- Save permission preferences to chrome.storage.local

#### 5. US-042 — MutationObserver Feed Detection
- Depends on: US-038
- Implement content script with MutationObserver
- Extract post data from LinkedIn DOM nodes
- Test on live LinkedIn feed

#### 6. US-043 — Post Scoring
- Depends on: US-042, US-039
- Build scorer.ts with local scoring logic
- Cache persona pillars from Firestore to chrome.storage.local

#### 7. US-044 — Badge Injection
- Depends on: US-043
- Inject LinkedBloom badge on high-scoring posts
- Implement dismiss functionality

#### 8. US-045 — Comment Overlay
- Depends on: US-044, US-032, US-039
- Build overlay panel with comment cards
- Wire to the generateCommentOptions Cloud Function

#### 9. US-046 — Comment Injection into LinkedIn
- Depends on: US-045
- Implement DOM injection into LinkedIn comment box
- Handle DOM-not-found fallback

#### 10. US-047 — Quick Draft Capture
- Depends on: US-044, US-039
- Build context menu on badge
- Create generateDraftFromCapture Cloud Function
- Wire chrome.notifications

#### 11. US-048 — Transparency Dashboard in Popup
- Depends on: US-040, US-042
- Build Activity and Privacy tabs in popup

### Sprint 5 Complete When:
- [ ] Extension loads as unpacked in Chrome without errors
- [ ] Extension shares auth session with web app
- [ ] Popup shows correct state for logged-in, paused, logged-out
- [ ] Welcome page shown on first install with permission toggles
- [ ] MutationObserver detects LinkedIn feed posts
- [ ] High-scoring posts show LinkedBloom badge
- [ ] Clicking badge opens comment overlay with 3 suggestions
- [ ] "Use this comment" inserts text into LinkedIn comment box
- [ ] Right-click badge shows context menu with capture option
- [ ] Transparency view shows session activity counts and privacy info

---

## SPRINT 6 — Persona Maturity + Platform Polish
**Duration:** Weeks 11–12
**Goal:** Deepen the persona system, add email notifications, content templates, and mobile polish. Close the beta loop — the platform should now feel complete enough for confident user feedback collection.

### Story Execution Order

#### 1. US-049 — Taste Intake Enrichment
- Depends on: US-034 (inspirations subcollection)
- Build "Refine My Taste" section in Settings → Persona

#### 2. US-050 — 30-Day Persona Refresh Flow
- Depends on: US-009
- Build refresh banner detection logic
- Build dedicated "Persona Refresh" chat session flow
- Build diff view for persona comparison
- Archive previous persona versions

#### 3. US-051 — Behavioral Signals from Extension
- Depends on: US-042, US-050
- Add opt-in toggle to extension Privacy settings
- Build weekly summary compilation and sync
- Add "What we learned" card to dashboard

#### 4. US-052 — Email Notifications
- Depends on: US-011, US-020, US-026
- Integrate Resend API
- Build sendEmail Cloud Function
- Set up scheduled post reminder trigger
- Set up weekly digest trigger (Monday 8am) via Cloud Scheduler

#### 5. US-053 — Content Templates Library
- No dependencies — can build in parallel
- Build /templates route with 8 built-in templates
- Add custom template save from content generator

#### 6. US-054 — Mobile Layout Polish
- No dependencies — can build in parallel with US-053
- Implement bottom navigation on mobile
- Fix all touch targets and scroll issues on core pages

### Sprint 6 Complete When:
- [ ] Users can upload taste samples and trigger persona re-generation
- [ ] 30-day persona refresh banner appears and refresh flow works end to end
- [ ] Extension behavioral sync opt-in works and shows "What we learned" card
- [ ] Scheduled post reminder emails send correctly
- [ ] Weekly digest email sends on Monday
- [ ] /templates page shows 8 built-in templates and supports custom templates
- [ ] App usable on 375px mobile viewport with no horizontal scroll
- [ ] Bottom navigation visible and functional on mobile

---

## Passing Sprint Context to Claude Code

When starting a new sprint session with Claude Code, use this prompt template:

```
Read the /project-documents folder in this repo, specifically:
- TRD.md for architecture and Firestore data model
- BACKLOG.md for user stories and acceptance criteria
- SPRINTS.md for the sprint execution order

We are working on Sprint [N]. 
The next story to implement is [US-XXX] — [Story Title].
Dependencies [list] are already complete.

Please:
1. Read the relevant sections of TRD.md for technical context
2. Read the acceptance criteria for [US-XXX] in BACKLOG.md
3. Identify the files that need to be changed
4. Implement the changes
5. Confirm each acceptance criterion is met
6. Commit with message: "[US-XXX] [Story Title]"
```

---

## Known Technical Context for Claude Code

### Existing Architecture (post-migration, see TRD.md v2.1)
- **Frontend:** React + TypeScript + Vite + Tailwind + shadcn-ui
- **Backend:** Firebase — Firestore, Auth, Cloud Functions (Node.js 20, 2nd gen), Storage, Cloud Scheduler
- **AI Model:** Gemini via Vertex AI (same GCP project, no API key) — model selectable per-request from an allowlist in `geminiClient.ts`
- **Existing Cloud Functions:** generateContent, personaAgent, prAgentChat
- **Existing Firestore Collections:** `users/{uid}` (profile), `users/{uid}/persona/main`, `users/{uid}/posts`, `users/{uid}/chatMessages`
- **Existing Storage Paths:** `admiredPosts/{uid}/`

### What Already Works (Do Not Break)
- Firebase Auth with email/password + Google OAuth
- 3-step onboarding flow → persona generation
- Content generator (topic/tone/length/instructions → Gemini → draft)
- Regeneration with feedback
- Persona display and one-click regenerate
- PR Agent chat with streaming SSE and persistent history
- Profile form and API key settings UI (wiring incomplete but UI exists)
- Dashboard layout and sidebar navigation

### Critical: Do Not Overwrite
- LinkedInConnect.tsx and linkedinService.ts exist as stubs — extend them, do not delete
- LinkedInAnalytics.tsx exists as stub — extend it
- The `admiredPosts/{uid}/` Storage path contains user data — do not delete or modify its security rules
