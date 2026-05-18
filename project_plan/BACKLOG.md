# Product Backlog
## LinkedBloom Scribe — Full Sprint Backlog
**Version:** 1.0 | **Date:** May 2026 | **Format:** Epic > Feature > User Story

---

## How to Read This Backlog

- **Epic:** Major product area
- **Feature:** Deliverable functionality within an epic
- **User Story:** "As a [user], I want to [action] so that [outcome]"
- **Acceptance Criteria (AC):** Specific, testable conditions for Done
- **Definition of Done (DoD):** Applies to ALL stories unless overridden
- **Dependencies:** Story IDs that must be complete before this story starts
- **Sprint:** Target sprint (S1–S6, 2 weeks each)

### Universal Definition of Done
- [ ] Code committed to main branch
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Supabase RLS policies applied to any new tables
- [ ] Edge Functions deployed to Supabase
- [ ] Tested manually against acceptance criteria
- [ ] Responsive on desktop (1280px) and mobile (375px) unless noted otherwise

---

# SPRINT 1
## Epic 1: Platform Foundation Fixes (P0)

---

### Feature 1.1 — Posts Table DB Migration

---

#### US-001: Add missing columns to posts table
**As a** developer  
**I want to** run a DB migration that adds all missing columns to the posts table  
**So that** no application data is silently lost when saving or loading posts

**Acceptance Criteria:**
- [ ] Migration file created at supabase/migrations/[timestamp]_add_posts_columns.sql
- [ ] Migration adds: hashtags text[], topic text, tone text, instructions text, post_length text, versions jsonb DEFAULT '[]'::jsonb, scheduled_at timestamptz, published_at timestamptz, linkedin_post_id text, source_inspiration_url text, performance_data jsonb
- [ ] Migration runs without error on existing DB with existing post rows
- [ ] All existing post rows unaffected (NULL values in new columns)
- [ ] Migration is idempotent (can be run twice without error)

**Dependencies:** None  
**Sprint:** S1

---

#### US-002: Update contentService to read and write all post fields
**As a** user  
**I want to** have my post's topic, tone, instructions, hashtags, and length saved when I generate content  
**So that** I can see exactly how each post was created and regenerate with the same settings

**Acceptance Criteria:**
- [ ] contentService.createPost() writes all fields: topic, tone, instructions, post_length, hashtags to DB
- [ ] contentService.updatePost() updates all fields on save
- [ ] contentService.getPost() returns all fields including new columns
- [ ] contentService.getPosts() (list) returns all fields
- [ ] No TypeScript type errors — Post type updated to include all new fields
- [ ] Existing posts load without error (nullable fields handled gracefully)

**Dependencies:** US-001  
**Sprint:** S1

---

#### US-003: Persist version history to DB on every generate and regenerate
**As a** user  
**I want to** have every version of my post saved automatically  
**So that** I can go back to a previous draft even after refreshing the page

**Acceptance Criteria:**
- [ ] Every call to generate-content Edge Function appends a new version entry to versions JSONB array on the post record
- [ ] Version object shape: { version_number: number, content: string, title: string, hashtags: string[], generated_at: ISO string, model_used: string, instructions_used: string }
- [ ] Version number auto-increments from current array length
- [ ] Regeneration with feedback also creates a new version (previous draft not overwritten)
- [ ] ContentPreview component renders version history list with version number and generated_at timestamp
- [ ] Each version item has a "Restore" button
- [ ] Clicking Restore replaces current editor content with that version's content (does not delete other versions)
- [ ] Restoring a version creates a new version entry with instructions_used: "restored from version N"
- [ ] Version count displayed as badge on post cards in drafts list

**Dependencies:** US-001, US-002  
**Sprint:** S1

---

### Feature 1.2 — Calendar Wired to Real Data

---

#### US-004: Replace calendar mock data with live Supabase query
**As a** user  
**I want to** see my actual scheduled and published posts on the calendar  
**So that** I can understand my real posting schedule at a glance

**Acceptance Criteria:**
- [ ] Calendar component fetches posts from Supabase filtered by: status IN ('scheduled', 'published') AND user_id = auth.uid()
- [ ] Posts displayed on correct calendar date based on scheduled_at (scheduled posts) or published_at (published posts)
- [ ] Loading skeleton shown while data fetches
- [ ] Empty state shown when no scheduled or published posts exist
- [ ] Calendar updates in real time when a post is scheduled or unscheduled in the same session (Supabase realtime or refetch on navigation)
- [ ] All hardcoded initialScheduledContent mock data removed from codebase

**Dependencies:** US-001  
**Sprint:** S1

---

#### US-005: Schedule a post from the content review page
**As a** user  
**I want to** pick a date and time to schedule my post  
**So that** it appears on my calendar and publishes automatically at that time

**Acceptance Criteria:**
- [ ] "Schedule Post" button on post review/final status page opens a date-time picker
- [ ] Date-time picker shows user's local timezone
- [ ] Cannot select a date in the past
- [ ] On confirm: post status updated to 'scheduled', scheduled_at set to chosen datetime in DB
- [ ] Success toast: "Post scheduled for [date/time]"
- [ ] Post appears on calendar on correct date immediately after scheduling
- [ ] Post status badge on drafts list updates to 'Scheduled' with date shown

**Dependencies:** US-001, US-004  
**Sprint:** S1

---

#### US-006: Reschedule a post from the calendar
**As a** user  
**I want to** change the scheduled date of a post by interacting with the calendar  
**So that** I can adjust my content plan without going back to the post editor

**Acceptance Criteria:**
- [ ] Clicking a scheduled post on the calendar opens a post detail panel/modal
- [ ] Panel shows: post title, content preview, current scheduled date, Reschedule button, Unschedule button, Edit button
- [ ] Reschedule button opens date-time picker pre-filled with current scheduled_at
- [ ] On reschedule confirm: scheduled_at updated in DB, calendar reflects new date immediately
- [ ] Edit button navigates to post editor for full editing
- [ ] Success toast shown on reschedule

**Dependencies:** US-004, US-005  
**Sprint:** S1

---

#### US-007: Delete a scheduled post from the calendar
**As a** user  
**I want to** remove a post from my schedule directly from the calendar  
**So that** I can quickly remove posts I no longer want to publish without navigating to the editor

**Acceptance Criteria:**
- [ ] Post detail panel on calendar has "Remove from schedule" button (NOT delete post — just unschedule)
- [ ] Confirmation dialog: "Remove this post from your schedule? The draft will be saved."
- [ ] On confirm: scheduled_at set to NULL, status reverted to 'draft', post disappears from calendar
- [ ] Post still accessible in drafts list with status 'draft'
- [ ] Separate "Delete post permanently" option in panel with two-step confirmation
- [ ] Permanently deleted post removed from DB and disappears from all views

**Dependencies:** US-004, US-005  
**Sprint:** S1

---

### Feature 1.3 — Settings Route and Page

---

#### US-008: Create /settings route so sidebar link does not 404
**As a** user  
**I want to** click Settings in the sidebar and land on a real page  
**So that** I don't hit a 404 and lose confidence in the product

**Acceptance Criteria:**
- [ ] /settings route defined in React Router config
- [ ] Settings page renders with correct sidebar layout and active nav highlight
- [ ] Page has four sections visible: Profile, API Keys, Notifications, Danger Zone
- [ ] Sections can be empty/placeholder — functional implementation in US-009 to US-012
- [ ] No console errors on load

**Dependencies:** None  
**Sprint:** S1

---

#### US-009: Edit profile information in Settings
**As a** user  
**I want to** update my profile details (name, title, industry, location, LinkedIn URL)  
**So that** my persona and content generation always uses accurate information about me

**Acceptance Criteria:**
- [ ] Profile section shows form pre-filled with current values from profiles table
- [ ] Editable fields: full_name, job_title (new column if not exists), industry, experience_level, location, linkedin_url, goal
- [ ] Save button updates profiles table via Supabase client
- [ ] Success toast on save
- [ ] Validation: LinkedIn URL must be a valid linkedin.com/in/ URL format
- [ ] Changes reflected immediately in sidebar user display (name/avatar)

**Dependencies:** US-008  
**Sprint:** S1

---

#### US-010: Manage API keys in Settings
**As a** user  
**I want to** add, update, or remove my Gemini and OpenAI API keys  
**So that** content generation uses my own API quota and I can swap providers

**Acceptance Criteria:**
- [ ] API Keys section shows masked input fields for Gemini API key and OpenAI API key
- [ ] Existing saved keys shown masked: "gm-••••••••••••••••xxxx" (last 4 chars visible)
- [ ] "Update key" interaction: clear mask and allow re-entry
- [ ] Save stores key encrypted in Supabase (api_keys table or profiles JSONB column — whichever exists)
- [ ] "Remove key" clears the key from DB with confirmation
- [ ] Keys validated by making a test API call on save — error shown if key is invalid
- [ ] Edge Functions read user's key from DB and use it for API calls (fall back to system key if user key not set)

**Dependencies:** US-008  
**Sprint:** S1

---

#### US-011: Configure notification preferences in Settings
**As a** user  
**I want to** choose which notifications I receive  
**So that** I'm reminded about my schedule without being overwhelmed by emails

**Acceptance Criteria:**
- [ ] Notifications section shows toggle list: "Remind me 1h before scheduled post" (default ON), "Weekly digest email" (default ON), "Post published confirmation" (default ON), "Engagement milestones" (default OFF)
- [ ] Toggles persist to profiles table (notification_preferences jsonb column)
- [ ] Changes saved automatically on toggle (no explicit save button needed)
- [ ] UI only — email sending wired in Sprint 5

**Dependencies:** US-008  
**Sprint:** S1

---

#### US-012: Delete all data from Danger Zone in Settings
**As a** user  
**I want to** permanently delete all my data with a clear confirmation flow  
**So that** I can trust that the platform respects my right to be forgotten

**Acceptance Criteria:**
- [ ] Danger Zone section with red border styling and warning copy
- [ ] "Delete all my data" button opens modal with: warning text listing what will be deleted, text input requiring user to type "DELETE" to confirm, red confirm button
- [ ] On confirm: deletes all rows from posts, personas, chat_messages, post_analytics, engagements, inspirations, extension_events, linkedin_accounts where user_id = current user
- [ ] Deletes all files from Supabase storage buckets belonging to user
- [ ] Calls Supabase auth.admin.deleteUser() to delete auth account
- [ ] User redirected to landing/signup page after deletion
- [ ] Action is irreversible — no soft delete

**Dependencies:** US-008  
**Sprint:** S1

---

# SPRINT 2
## Epic 2: LinkedIn Integration (P1)

---

### Feature 2.1 — LinkedIn OAuth Connection

---

#### US-013: Create linkedin_accounts DB table and migration
**As a** developer  
**I want to** have a secure DB table to store encrypted LinkedIn OAuth tokens  
**So that** user tokens are persisted and retrievable for API calls

**Acceptance Criteria:**
- [ ] Migration creates linkedin_accounts table with all columns per TRD schema
- [ ] RLS enabled: users can only read/write their own rows
- [ ] Unique index on (user_id) WHERE is_active = true (one active connection per user)
- [ ] Token columns are text type (will store AES-256 encrypted strings)

**Dependencies:** None  
**Sprint:** S2

---

#### US-014: Implement LinkedIn OAuth 2.0 PKCE flow
**As a** user  
**I want to** connect my LinkedIn account by logging in via LinkedIn's OAuth  
**So that** the platform can publish posts and fetch analytics on my behalf

**Acceptance Criteria:**
- [ ] "Connect LinkedIn" button in Settings → LinkedIn section initiates OAuth flow
- [ ] Edge Function: linkedin-oauth-init generates PKCE code_verifier and code_challenge, stores code_verifier in Supabase session, returns LinkedIn authorization URL
- [ ] User redirected to LinkedIn with: response_type=code, client_id, redirect_uri, scope, state (CSRF token), code_challenge, code_challenge_method=S256
- [ ] OAuth callback route /auth/linkedin/callback defined in React Router
- [ ] Edge Function: linkedin-oauth-callback receives code, verifies state, exchanges code for tokens using code_verifier
- [ ] Tokens encrypted with AES-256 and stored in linkedin_accounts table
- [ ] User redirected back to Settings with success message
- [ ] linkedin_member_id stored from /v2/me API call after successful token exchange

**Dependencies:** US-013  
**Sprint:** S2

---

#### US-015: Show LinkedIn connection status across the app
**As a** user  
**I want to** see whether my LinkedIn account is connected in Settings and on the dashboard  
**So that** I always know the connection state and can act if it's disconnected

**Acceptance Criteria:**
- [ ] Settings → LinkedIn section shows: "Connected as [LinkedIn name]" with green badge if active token exists
- [ ] "Disconnect" button shown when connected
- [ ] Dashboard header shows LinkedIn connection status indicator (small badge)
- [ ] If token is expired and refresh fails, status shows "Reconnect required" with orange badge
- [ ] "Publish to LinkedIn" button on posts disabled with tooltip "Connect LinkedIn first" when not connected

**Dependencies:** US-014  
**Sprint:** S2

---

#### US-016: Disconnect LinkedIn account
**As a** user  
**I want to** disconnect my LinkedIn account  
**So that** I can revoke access at any time and re-connect with a different account

**Acceptance Criteria:**
- [ ] "Disconnect" button in Settings → LinkedIn section
- [ ] Confirmation modal: "Disconnect LinkedIn? Scheduled posts will not be published until you reconnect."
- [ ] On confirm: linkedin_accounts row for user set to is_active = false, tokens cleared
- [ ] Connection status updates to disconnected immediately
- [ ] "Publish to LinkedIn" button disabled across app

**Dependencies:** US-015  
**Sprint:** S2

---

#### US-017: Implement automatic token refresh
**As a** developer  
**I want to** automatically refresh LinkedIn access tokens before they expire  
**So that** users never have to manually reconnect due to token expiry

**Acceptance Criteria:**
- [ ] Edge Function: linkedin-refresh-token fetches tokens for all users where token_expires_at < now() + interval '1 hour'
- [ ] Calls LinkedIn token refresh endpoint with refresh_token
- [ ] On success: updates access_token_encrypted, token_expires_at, last_refreshed_at in DB
- [ ] On failure (refresh token expired): sets is_active = false, queues notification to user
- [ ] Function invoked by Supabase pg_cron job every 30 minutes
- [ ] Refresh operations logged (success/failure) without logging token values

**Dependencies:** US-014  
**Sprint:** S2

---

### Feature 2.2 — Post Publishing to LinkedIn

---

#### US-018: Create linkedin-publish-post Edge Function
**As a** developer  
**I want to** have an Edge Function that posts content to LinkedIn on behalf of the user  
**So that** the client app can publish without ever handling LinkedIn tokens

**Acceptance Criteria:**
- [ ] Edge Function: linkedin-publish-post accepts: post_id (uuid)
- [ ] Fetches post content, title, hashtags from posts table
- [ ] Fetches user's encrypted access token from linkedin_accounts, decrypts
- [ ] Constructs LinkedIn UGC Post payload: author (urn:li:person:{member_id}), lifecycleState: PUBLISHED, specificContent with shareCommentary (content + hashtags)
- [ ] POSTs to LinkedIn /v2/ugcPosts
- [ ] On success: updates post in DB — status='published', linkedin_post_id, published_at
- [ ] On failure: returns structured error with LinkedIn API error code and message
- [ ] Function never logs or returns decrypted token values

**Dependencies:** US-014, US-013  
**Sprint:** S2

---

#### US-019: Add "Publish to LinkedIn" button to post review page
**As a** user  
**I want to** publish my approved post to LinkedIn with one click from the review page  
**So that** I can go from approved draft to live LinkedIn post without leaving the app

**Acceptance Criteria:**
- [ ] "Publish to LinkedIn" button visible on posts with status 'final'
- [ ] Button disabled with tooltip if LinkedIn not connected
- [ ] Clicking button shows confirmation modal: post preview + "Publish now" confirm button
- [ ] Loading state on button during API call
- [ ] On success: post status updated to 'published', success toast with "View on LinkedIn" link
- [ ] On failure: error toast with specific error message, status unchanged
- [ ] Published post shows: LinkedIn icon badge, published timestamp, "View on LinkedIn" link
- [ ] Published posts not editable (read-only view)

**Dependencies:** US-018, US-015  
**Sprint:** S2

---

#### US-020: Auto-publish scheduled posts via cron
**As a** user  
**I want to** have my scheduled posts published automatically at the scheduled time  
**So that** I don't have to be online at the exact moment a post is due to go out

**Acceptance Criteria:**
- [ ] Supabase pg_cron job runs every 5 minutes
- [ ] Cron queries posts WHERE status = 'scheduled' AND scheduled_at <= now() AND user_id in (select user_id from linkedin_accounts where is_active = true)
- [ ] For each post found: calls linkedin-publish-post Edge Function
- [ ] On success: post status updated to 'published', published_at set
- [ ] On failure: post status set to 'publish_failed', error stored in performance_data jsonb, user notified
- [ ] Cron never processes the same post twice (status check prevents reprocessing)

**Dependencies:** US-018, US-017  
**Sprint:** S2

---

#### US-021: Show published post on LinkedIn link and status
**As a** user  
**I want to** see a direct link to my published post on LinkedIn from within the app  
**So that** I can quickly check how it appears and share it externally

**Acceptance Criteria:**
- [ ] Published posts display: "Published on LinkedIn" badge in green
- [ ] "View on LinkedIn" button opens https://www.linkedin.com/feed/update/{linkedin_post_id} in new tab
- [ ] Published timestamp shown: "Published 2 hours ago"
- [ ] Post content display is read-only (no edit button on published posts)
- [ ] Published posts appear in a "Published" tab/filter in drafts list
- [ ] Published post card in list shows: title, published date, quick engagement stats when available

**Dependencies:** US-019  
**Sprint:** S2

---

### Feature 2.3 — Post Performance Import

---

#### US-022: Create post_analytics table and migration
**As a** developer  
**I want to** have a DB table to store LinkedIn post performance metrics  
**So that** analytics can be displayed in the app without calling LinkedIn API on every page load

**Acceptance Criteria:**
- [ ] Migration creates post_analytics table per TRD schema
- [ ] RLS enabled
- [ ] Composite unique index on (post_id, fetch_period) to prevent duplicate period entries
- [ ] Engagement rate computed column or calculated on insert

**Dependencies:** US-001  
**Sprint:** S2

---

#### US-023: Create linkedin-fetch-analytics Edge Function
**As a** developer  
**I want to** have an Edge Function that fetches LinkedIn post metrics and stores them  
**So that** analytics data is always up to date without the client polling LinkedIn directly

**Acceptance Criteria:**
- [ ] Edge Function: linkedin-fetch-analytics accepts: post_id (uuid), fetch_period (text)
- [ ] Fetches linkedin_post_id from posts table
- [ ] Calls LinkedIn /v2/organizationalEntityShareStatistics with the post URN
- [ ] Parses: impressions, reactions, comments, shares, clicks from response
- [ ] Calculates engagement_rate = (reactions + comments + shares) / impressions * 100
- [ ] Upserts to post_analytics table (update if same post_id + fetch_period exists)
- [ ] Handles LinkedIn API rate limiting with exponential backoff
- [ ] Returns structured response with metrics

**Dependencies:** US-022, US-014  
**Sprint:** S2

---

#### US-024: Schedule automatic analytics fetches at defined intervals
**As a** user  
**I want to** have my post analytics automatically refreshed at 24h, 48h, 7d, 14d, and 30d  
**So that** I can see how my posts perform over time without manually requesting refreshes

**Acceptance Criteria:**
- [ ] On post publish: schedule analytics fetch jobs at +24h, +48h, +7d, +14d, +30d using pg_cron or Supabase scheduled functions
- [ ] Each job calls linkedin-fetch-analytics with the correct fetch_period label
- [ ] Jobs only run if LinkedIn account still connected (is_active = true)
- [ ] Failed fetches retried up to 3 times with exponential backoff
- [ ] Fetch jobs for deleted posts cleaned up

**Dependencies:** US-023, US-019  
**Sprint:** S2

---

#### US-025: Manual "Refresh metrics" button on published post view
**As a** user  
**I want to** manually trigger a metrics refresh for any published post  
**So that** I can get the latest data without waiting for the scheduled fetch

**Acceptance Criteria:**
- [ ] "Refresh metrics" button on published post analytics view
- [ ] Calls linkedin-fetch-analytics with fetch_period='manual'
- [ ] Loading state on button during fetch (disabled to prevent double-click)
- [ ] Success: metrics updated, last fetched timestamp shown
- [ ] Rate limited: button disabled for 15 minutes after last manual refresh
- [ ] Error state shown if LinkedIn API call fails

**Dependencies:** US-023  
**Sprint:** S2

---

# SPRINT 3
## Epic 3: Analytics Dashboard (P1)

---

#### US-026: Replace dashboard KPI cards with real LinkedIn metrics
**As a** user  
**I want to** see my actual LinkedIn performance data on the dashboard  
**So that** I can understand my real reach and engagement at a glance

**Acceptance Criteria:**
- [ ] KPI card 1: Total Impressions (last 30 days) — sum from post_analytics
- [ ] KPI card 2: Total Reactions (last 30 days)
- [ ] KPI card 3: Average Engagement Rate (last 30 days) — mean across all posts
- [ ] KPI card 4: Posts Published (last 30 days) — count from posts table
- [ ] Each KPI card shows trend: +X% vs previous 30 days (requires 60 days of data; otherwise shows "Not enough data")
- [ ] All mock KPI data removed
- [ ] Data sourced from post_analytics via Supabase query (not from LinkedIn API directly)
- [ ] Dashboard shows "Connect LinkedIn to see real metrics" CTA if not connected

**Dependencies:** US-022, US-023  
**Sprint:** S3

---

#### US-027: Add top-performing post card to dashboard
**As a** user  
**I want to** see my best performing post highlighted on the dashboard  
**So that** I can understand what content resonates most with my audience

**Acceptance Criteria:**
- [ ] "Top Post This Month" card on dashboard
- [ ] Shows post with highest engagement rate in last 30 days
- [ ] Card displays: post title (first 60 chars), published date, engagement rate, impressions, reactions
- [ ] "View post" link opens post detail
- [ ] "View on LinkedIn" link opens original LinkedIn post
- [ ] Empty state if no published posts in last 30 days

**Dependencies:** US-026  
**Sprint:** S3

---

#### US-028: Per-post analytics tab on post detail page
**As a** user  
**I want to** see detailed analytics for each published post  
**So that** I can learn from each post's performance and improve future content

**Acceptance Criteria:**
- [ ] "Analytics" tab on post detail view (only visible for published posts)
- [ ] Metrics displayed: impressions, reactions, comments, shares, clicks, engagement rate
- [ ] Engagement timeline: table or chart showing metrics at each fetch_period (24h, 48h, 7d, 14d, 30d)
- [ ] Comparison to user's average: "Your average engagement rate is X% — this post performed Y% above/below average"
- [ ] "What worked" AI insight: one short paragraph from Gemini analysing the post content + metrics
- [ ] AI insight generated on first view, cached in post record — not regenerated on every view
- [ ] "Export CSV" button downloads metrics for that post

**Dependencies:** US-022, US-023, US-026  
**Sprint:** S3

---

#### US-029: Build engagement trends page
**As a** user  
**I want to** see charts showing my engagement trends over time  
**So that** I can identify patterns and make informed decisions about my content strategy

**Acceptance Criteria:**
- [ ] New /analytics route accessible from sidebar
- [ ] Impressions over time: line chart, last 90 days, each published post as a data point
- [ ] Reactions by topic: bar chart grouping post reactions by topic field
- [ ] Format breakdown: pie or bar chart comparing avg engagement rate by post_length (short/medium/long)
- [ ] Tone breakdown: avg engagement rate by tone
- [ ] Best performing day/time: heat map or sorted list of day/hour combinations by avg engagement (requires ≥10 published posts)
- [ ] Progress state shown when <3 published posts exist: "Publish X more posts to unlock insights"
- [ ] Charts built with recharts (already in stack)
- [ ] Page fully responsive

**Dependencies:** US-026, US-028  
**Sprint:** S3

---

#### US-030: LinkedIn post import for baseline analytics
**As a** user  
**I want to** import my existing LinkedIn posts  
**So that** I have a performance baseline and my analytics include pre-platform history

**Acceptance Criteria:**
- [ ] "Import LinkedIn posts" button in Settings → LinkedIn section
- [ ] Edge Function: linkedin-import-posts fetches up to 50 most recent posts from LinkedIn API
- [ ] Each imported post stored in posts table with: status='published', source='linkedin_import', content, published_at, linkedin_post_id
- [ ] Deduplication: if linkedin_post_id already exists in DB, skip
- [ ] After import: linkedin-fetch-analytics triggered for each imported post
- [ ] Progress indicator during import with count: "Importing 12 of 50 posts..."
- [ ] Success message: "Imported 47 posts. 3 were already in your library."
- [ ] Imported posts appear in drafts list with "Imported" badge
- [ ] Imported posts included in all analytics calculations

**Dependencies:** US-014, US-023  
**Sprint:** S3

---

# SPRINT 4
## Epic 4: Engagement Intelligence (P2)

---

### Feature 4.1 — Comment Drafting Tool

---

#### US-031: Create engagements DB table
**As a** developer  
**I want to** have a DB table to store comment drafting sessions  
**So that** users can review and track their engagement history

**Acceptance Criteria:**
- [ ] Migration creates engagements table per TRD schema
- [ ] RLS enabled
- [ ] Indexes on user_id and created_at

**Dependencies:** US-001  
**Sprint:** S4

---

#### US-032: Create generate-comment-options Edge Function
**As a** developer  
**I want to** have an Edge Function that generates persona-aware comment options  
**So that** both the web app and Chrome extension can use the same comment generation logic

**Acceptance Criteria:**
- [ ] Edge Function: generate-comment-options accepts: source_post_text (string), source_post_url (optional string), user_id (from JWT)
- [ ] Fetches user's active persona from personas table
- [ ] Gemini prompt generates exactly 3 comment options with different approaches: (1) agree-and-extend: adds a complementary insight, (2) clarifying question: asks a thoughtful follow-up, (3) respectful challenge: offers a different perspective
- [ ] Each comment: max 200 words, written in user's voice (uses voice_profile from persona), no generic openers like "Great post!", no emojis unless user's voice profile includes them
- [ ] Returns array of 3 comment objects: { approach: string, comment: string, character_count: number }
- [ ] Character count must be under 1,250 (LinkedIn limit)
- [ ] Response time target: < 3 seconds

**Dependencies:** US-031  
**Sprint:** S4

---

#### US-033: Build comment drafting page in web app
**As a** user  
**I want to** paste a LinkedIn post and get three on-brand comment options  
**So that** I can engage thoughtfully with others' content without spending 20 minutes writing a comment

**Acceptance Criteria:**
- [ ] New route /engage accessible from sidebar under "Engage"
- [ ] Input area: tabbed input — "Paste post text" tab and "Paste LinkedIn URL" tab
- [ ] URL tab: fetches post text from URL (best-effort; show error if unable to fetch)
- [ ] Submit button: "Generate comment options"
- [ ] Loading state while generating (skeleton cards)
- [ ] Three comment option cards displayed with: approach label, comment text, character count bar (turns red if >1,250)
- [ ] Each card: "Copy to clipboard" button, inline edit capability (textarea), "Save engagement" button
- [ ] "Regenerate all" button fetches 3 new options
- [ ] "Regenerate this one" button on each card regenerates just that approach
- [ ] Saving engagement stores to engagements table with source_post_url, comment_options, selected_comment
- [ ] History tab on /engage page shows past engagement sessions (last 20)

**Dependencies:** US-032  
**Sprint:** S4

---

### Feature 4.2 — Inspiration Library

---

#### US-034: Create inspirations DB table and storage bucket
**As a** developer  
**I want to** have a DB table and storage bucket for the inspiration library  
**So that** users can save and retrieve LinkedIn posts that inspire them

**Acceptance Criteria:**
- [ ] Migration creates inspirations table per TRD schema
- [ ] RLS enabled
- [ ] Supabase storage bucket 'inspirations' created with private access (user-scoped policies)
- [ ] Storage policy: users can only read/write objects under their own user_id path prefix

**Dependencies:** None  
**Sprint:** S4

---

#### US-035: Build inspiration library page
**As a** user  
**I want to** save LinkedIn posts that inspire me and see them in a searchable library  
**So that** I can build a personal reference collection and understand what content I admire

**Acceptance Criteria:**
- [ ] New route /inspiration accessible from sidebar
- [ ] "Add inspiration" button opens slide-over panel
- [ ] Add form fields: LinkedIn post URL (optional), post text (paste, required if no URL), author name (optional), personal note/takeaway (optional), topic tags (free text, comma-separated, auto-suggests user's content pillars)
- [ ] Screenshot upload: drag-and-drop or file picker, stores in Supabase storage
- [ ] On save: stored to inspirations table, screenshot uploaded to storage if provided
- [ ] Inspiration cards grid: shows screenshot thumbnail (or placeholder), source URL link, note preview, tags, date saved
- [ ] Search bar: filters by keyword across source_text and note fields
- [ ] Tag filter: click tag to filter library to that tag
- [ ] Delete inspiration: confirmation dialog, removes row and storage file
- [ ] Empty state with guidance when library is empty
- [ ] Count badge on sidebar: "Inspiration (12)"

**Dependencies:** US-034  
**Sprint:** S4

---

#### US-036: Reference inspiration library in content generation
**As a** user  
**I want to** have the content generator consider my saved inspirations  
**So that** generated posts reflect the style and topics I actually admire

**Acceptance Criteria:**
- [ ] Content generator fetches user's saved inspirations (last 10 most recent) and includes them as context in Gemini prompt
- [ ] Prompt section: "Here are posts this user finds inspiring — consider their style, topics, and approach when generating"
- [ ] Toggle in content generator: "Use inspiration library" (default ON)
- [ ] When toggle OFF: inspirations not included in prompt
- [ ] No user-visible change to UI beyond toggle — content quality improvement is the feature

**Dependencies:** US-034, US-035  
**Sprint:** S4

---

#### US-037: Build feed insights from inspiration library
**As a** user  
**I want to** see AI-generated insights about the patterns in my saved inspirations  
**So that** I understand what works in my niche and can apply those patterns to my own content

**Acceptance Criteria:**
- [ ] "Insights" tab on /inspiration page
- [ ] "Generate insights" button (not automatic — user triggers)
- [ ] Requires minimum 5 saved inspirations — button disabled with explanation if fewer
- [ ] Gemini analyses all saved inspirations and returns:
  - Top 3 recurring topics in your saved posts
  - Common hook patterns (question opener, bold statement, story opener, etc.)
  - Dominant post formats (list, narrative, insight + lesson, etc.)
  - Average post length in words
  - "What makes this content work" summary paragraph
- [ ] Results displayed as insight cards with examples quoted from saved posts
- [ ] "Create a post using these patterns" button → pre-fills content generator with identified patterns as instructions
- [ ] Insights cached — only regenerate when user clicks "Refresh insights"
- [ ] Last generated timestamp shown

**Dependencies:** US-035  
**Sprint:** S4

---

# SPRINT 5
## Epic 5: Chrome Extension (P3)

---

### Feature 5.1 — Extension Scaffold and Auth

---

#### US-038: Set up Chrome extension project scaffold
**As a** developer  
**I want to** have a properly structured Manifest V3 Chrome extension project  
**So that** all extension features can be built on a solid, correctly configured foundation

**Acceptance Criteria:**
- [ ] /extension folder created at repo root with own package.json
- [ ] Vite + CRXJS plugin configured for Manifest V3 build
- [ ] manifest.json with correct permissions: storage, activeTab, scripting and host_permissions for linkedin.com
- [ ] Background service worker file created and registered
- [ ] Content script file created for linkedin.com/* match
- [ ] Popup HTML + TS files created
- [ ] TypeScript configured (tsconfig.json)
- [ ] npm run dev builds extension to /extension/dist — loadable as unpacked extension in Chrome
- [ ] npm run build creates production build
- [ ] Extension icons (16, 32, 48, 128px) created and referenced in manifest

**Dependencies:** None  
**Sprint:** S5

---

#### US-039: Implement session sharing between web app and extension
**As a** user  
**I want to** be automatically logged into the extension when I'm logged into the web app  
**So that** I don't have to log in twice

**Acceptance Criteria:**
- [ ] Web app writes Supabase JWT to chrome.storage.local under key 'lb_session' on login
- [ ] Web app clears 'lb_session' from chrome.storage.local on logout
- [ ] Extension popup reads 'lb_session' on open
- [ ] If valid JWT found: popup shows logged-in state (user name fetched from JWT claims)
- [ ] If no JWT or expired: popup shows "Open LinkedBloom to log in" with link to web app
- [ ] Extension service worker checks session validity before any API calls
- [ ] Session check uses Supabase JWT verification (expiry check) — no additional API call needed

**Dependencies:** US-038  
**Sprint:** S5

---

#### US-040: Build extension popup UI
**As a** user  
**I want to** open the extension popup and see my current status and quick actions  
**So that** I can control the extension and jump to key actions without opening the full web app

**Acceptance Criteria:**
- [ ] Popup dimensions: 320px wide, auto height
- [ ] Logged-in state shows: LinkedBloom logo, user name, "Monitoring LinkedIn" status with green dot, pause/resume toggle, session stats (posts scanned today, comments drafted today), "Open LinkedBloom" button, "Activity" section with today's counts
- [ ] Paused state shows: grey dot, "Monitoring paused" text, resume button
- [ ] Logged-out state shows: logo, "Log in to LinkedBloom to activate" message, "Open app" button
- [ ] Footer: extension version, "Privacy settings" link, "Help" link

**Dependencies:** US-039  
**Sprint:** S5

---

#### US-041: Show permission and privacy explanation on first install
**As a** user  
**I want to** see a clear explanation of what the extension monitors when I first install it  
**So that** I can make an informed decision about granting permissions

**Acceptance Criteria:**
- [ ] On first install (detected via chrome.storage.local 'installed' flag absence): opens options/welcome page in new tab
- [ ] Welcome page explains in plain English: what is monitored (posts visible in feed, your comments you write), what stays local (scroll patterns, dwell time, all unactioned post content), what goes to cloud (post text when you request a comment, post text when you capture a draft)
- [ ] Three permission toggles with descriptions: "Monitor feed posts for engagement opportunities" (required), "Sync weekly topic patterns to improve your persona" (optional, default OFF), "Capture quick drafts from the feed" (optional, default ON)
- [ ] "Get started" button saves preferences to chrome.storage.local and closes tab
- [ ] Preferences editable later from popup "Privacy settings" link

**Dependencies:** US-039  
**Sprint:** S5

---

### Feature 5.2 — Feed Post Detection

---

#### US-042: Implement MutationObserver to detect LinkedIn feed posts
**As a** developer  
**I want to** detect LinkedIn feed posts as they load and scroll into view  
**So that** the extension can analyse and badge relevant posts in real time

**Acceptance Criteria:**
- [ ] Content script initialises MutationObserver on linkedin.com/feed/* pages
- [ ] Observer watches document.body with childList: true, subtree: true
- [ ] For each new post node detected: extract author name, post text (first 500 chars), post URL (from data-id attribute or anchor), reaction count, comment count
- [ ] Extraction handles both standard feed posts and shared/repost formats
- [ ] Each detected post stored in memory (Map) with post hash as key — prevents reprocessing
- [ ] Observer paused when user pauses monitoring from popup
- [ ] No data sent to cloud at this stage — detection is fully local

**Dependencies:** US-038  
**Sprint:** S5

---

#### US-043: Score posts for engagement opportunity
**As a** developer  
**I want to** score each detected post for engagement opportunity locally  
**So that** only genuinely high-value posts surface to the user as suggestions

**Acceptance Criteria:**
- [ ] Scoring function in scorer.ts runs fully client-side (no API call)
- [ ] Score inputs (all local): topic relevance (keyword match against user's content pillars from cached persona), comment count (sweet spot: 5–100; too few or too many reduces score), post recency (< 6h: high score, 6–24h: medium, >24h: low), author relationship (accounts user has previously engaged with get bonus)
- [ ] Score output: 0–100 integer
- [ ] Threshold for badge: score ≥ 65
- [ ] User's content pillars cached in chrome.storage.local from last persona sync (refreshed on extension load if session valid)
- [ ] Scoring completes in < 50ms per post

**Dependencies:** US-042, US-039  
**Sprint:** S5

---

#### US-044: Inject engagement opportunity badge on high-scoring posts
**As a** user  
**I want to** see a subtle indicator on LinkedIn posts that are good opportunities for me to engage  
**So that** I don't miss high-value conversations in my feed

**Acceptance Criteria:**
- [ ] Badge injected as a small overlay on top-right corner of post card for posts scoring ≥ 65
- [ ] Badge design: small LinkedBloom icon (16px) with subtle glow, unobtrusive
- [ ] Badge does not shift or reflow LinkedIn's native layout
- [ ] Tooltip on badge hover: "Good engagement opportunity — click to draft a comment"
- [ ] Badge dismissed on "✕" click — hidden for that post for the remainder of the session (stored in chrome.storage.local)
- [ ] Badge not injected on user's own posts
- [ ] Badge not injected on already-commented posts (extension checks if user's comment exists in post)
- [ ] When monitoring is paused, no new badges injected; existing badges remain

**Dependencies:** US-043  
**Sprint:** S5

---

### Feature 5.3 — Comment Drafting Overlay

---

#### US-045: Build comment drafting overlay triggered from badge
**As a** user  
**I want to** click a badge on a LinkedIn post and see AI-generated comment suggestions  
**So that** I can draft a thoughtful comment without leaving LinkedIn

**Acceptance Criteria:**
- [ ] Clicking badge opens overlay panel anchored to the right side of the post card
- [ ] Overlay width: 340px, positioned to not obscure post content
- [ ] Overlay header: LinkedBloom logo, post author name, "×" close button
- [ ] Loading state: skeleton cards while API call in progress
- [ ] API call: sends post text to generate-comment-options Edge Function with user JWT
- [ ] Three comment cards displayed with approach label and comment text
- [ ] Character count on each card (turns amber >800, red >1,200)
- [ ] "Use this comment" button on each card
- [ ] "Regenerate" button (regenerates all 3)
- [ ] "Save to inspiration" button saves source post to inspirations table
- [ ] Overlay closes on outside click or Escape key
- [ ] Overlay state preserved if user scrolls while overlay open

**Dependencies:** US-044, US-032, US-039  
**Sprint:** S5

---

#### US-046: Insert selected comment into LinkedIn's native comment box
**As a** user  
**I want to** click "Use this comment" and have it inserted into LinkedIn's comment field  
**So that** I can review, edit, and post it without copying and pasting manually

**Acceptance Criteria:**
- [ ] "Use this comment" injects selected comment text into LinkedIn's native comment contenteditable div
- [ ] Focus moves to LinkedIn's comment box after injection
- [ ] User can freely edit the injected text before posting
- [ ] Extension does NOT click LinkedIn's "Post" button — user must post manually
- [ ] Overlay closes after "Use this comment" click
- [ ] If LinkedIn's comment box is not found (DOM change): shows error "Could not find comment box — copy the text instead" with copy button
- [ ] Injected text triggers LinkedIn's character count natively

**Dependencies:** US-045  
**Sprint:** S5

---

### Feature 5.4 — Quick Draft Capture

---

#### US-047: Add "Draft from this post" to badge context menu
**As a** user  
**I want to** right-click (or long-press) the LinkedBloom badge to capture a post as a draft inspiration  
**So that** I can build a queue of post ideas from content I come across in my feed

**Acceptance Criteria:**
- [ ] Right-click or secondary click on badge shows context menu with options: "Draft a comment", "Capture as draft inspiration", "Save to inspiration library", "Dismiss"
- [ ] "Capture as draft inspiration" sends post text + URL to generate-draft-from-capture Edge Function
- [ ] Edge Function: Gemini generates a new post inspired by (not copying) the captured content, using user's persona
- [ ] Draft saved to posts table with status='draft', source_inspiration_url=captured post URL, topic auto-detected from content
- [ ] Popup notification (chrome.notifications): "Draft created — review in LinkedBloom" with button opening web app
- [ ] Context menu dismisses after selection
- [ ] Works on all LinkedIn post types: standard posts, articles, reposts

**Dependencies:** US-044, US-039  
**Sprint:** S5

---

### Feature 5.5 — Transparency Dashboard

---

#### US-048: Build activity and transparency view in popup
**As a** user  
**I want to** see exactly what the extension has collected in this session  
**So that** I can trust the extension and understand its activity at any moment

**Acceptance Criteria:**
- [ ] "Activity" tab in popup shows session stats: posts scanned, badges shown, comments drafted, drafts captured — all sourced from chrome.storage.local session data
- [ ] "Privacy" tab shows two sections: "Stays on your device" (bullet list: scroll patterns, dwell time, full content of unactioned posts, browsing history) and "Sent to cloud (only when you act)" (bullet list: post text when you request a comment, post text when you capture a draft, weekly topic summary if opted in)
- [ ] "Pause monitoring" toggle in popup immediately disconnects MutationObserver
- [ ] "Clear session data" button clears all chrome.storage.local data for this extension (with confirmation)
- [ ] Link to full privacy page in LinkedBloom web app
- [ ] All counts update in real time while popup is open (polling chrome.storage.local every 2s)

**Dependencies:** US-040, US-042  
**Sprint:** S5

---

# SPRINT 6
## Epic 6: Persona Intelligence Maturity (P4)

---

#### US-049: Build taste intake enrichment in persona settings
**As a** user  
**I want to** upload content samples and annotate what I like about them  
**So that** my persona model reflects my actual aesthetic and communication preferences

**Acceptance Criteria:**
- [ ] "Refine My Taste" section in Settings → Persona
- [ ] Upload up to 10 content samples: supported types — text (paste), image (upload), screenshot (upload), URL
- [ ] For each sample: annotation field "What do you like about this?" (free text) + tag selector (tone, format, topic, visual style)
- [ ] Visual style selector: 12 cards with labels (minimalist, data-driven, storytelling, etc.) — user picks up to 3
- [ ] All samples stored in inspirations table with type='taste_sample'
- [ ] "Update persona with these samples" button triggers persona refresh with taste samples in context
- [ ] User sees confirmation: "Your persona will be updated to reflect your taste preferences"

**Dependencies:** US-034  
**Sprint:** S6

---

#### US-050: Implement 30-day persona refresh flow
**As a** user  
**I want to** be prompted to refresh my persona every 30 days with a conversational flow  
**So that** my voice profile stays accurate as my focus and communication style evolve

**Acceptance Criteria:**
- [ ] In-app banner shown when now() > personas.generated_at + interval '30 days' for active persona
- [ ] Banner: "Time to refresh your persona — your voice may have evolved" with "Refresh now" and "Remind me in 7 days" options
- [ ] Refresh opens PR agent chat in a dedicated "Persona Refresh" session with 3–5 questions
- [ ] Questions generated by Gemini based on what has changed since last refresh (new posts written, new topics engaged with, time elapsed)
- [ ] Example questions: "I notice you've been writing a lot about distributed systems lately — is that becoming a stronger focus for you?" or "It's been 30 days — has your career focus shifted at all?"
- [ ] After answers collected: new persona generated with: original onboarding data + all posts since last refresh + chat history + refresh conversation
- [ ] New persona shown as diff view: changed sections highlighted, unchanged sections greyed
- [ ] User options: Accept all changes, Accept selected changes (toggle per section), Keep current persona
- [ ] Previous persona archived in personas table (is_active=false, version incremented)
- [ ] Manual trigger: "Refresh persona now" button in Settings → Persona

**Dependencies:** US-009  
**Sprint:** S6

---

#### US-051: Sync behavioral signals from extension to persona
**As a** user  
**I want to** have my LinkedIn engagement patterns feed into my persona model  
**So that** the system learns from what I actually do, not just what I say about myself

**Acceptance Criteria:**
- [ ] Opt-in toggle in extension privacy settings: "Share weekly engagement patterns to improve my persona" (default OFF)
- [ ] When opted in: extension compiles weekly summary every 7 days from local data: top 3 topics engaged with (liked/commented on), engagement style pattern (question-asker / opinion-sharer / information-seeker), post scan count, comment draft count
- [ ] Summary synced to extension_events table (not raw data)
- [ ] "What we learned this week" card on dashboard: shows current week's behavioral summary in plain English
- [ ] User can correct any inference: "Mark as inaccurate" on any behavioural insight
- [ ] Corrections stored as notes in extension_events row
- [ ] Behavioral summary included in next persona refresh context

**Dependencies:** US-042, US-050  
**Sprint:** S6

---

## Epic 7: Platform Maturity (P4)

---

#### US-052: Implement post reminder and weekly digest emails
**As a** user  
**I want to** receive email reminders for scheduled posts and a weekly performance digest  
**So that** I never miss a scheduled post and always know how my LinkedIn presence is performing

**Acceptance Criteria:**
- [ ] Resend API integrated via Edge Function: send-notification-email
- [ ] Reminder email: sent 1 hour before scheduled_at for each post WHERE status='scheduled' AND user has reminder notifications enabled
- [ ] Reminder email content: post title, scheduled time, "View post" deep link, "Reschedule" deep link
- [ ] Weekly digest email: sent every Monday 8am user local time (approximated by timezone in profile)
- [ ] Digest content: posts published last week (count + titles), total impressions, total reactions, top post, suggested topics for this week (3 suggestions from PR agent)
- [ ] Unsubscribe link in every email (sets notification_preferences toggle to false in DB)
- [ ] Emails only sent if user has verified email address

**Dependencies:** US-011, US-020, US-026  
**Sprint:** S6

---

#### US-053: Build content templates library
**As a** user  
**I want to** choose from pre-built content templates to speed up post creation  
**So that** I don't start every post from a blank slate

**Acceptance Criteria:**
- [ ] New route /templates accessible from content generator and sidebar
- [ ] Template categories: Lessons Learned, Project Launch, Hot Take / Opinion, Tutorial / How-To, Career Milestone, Industry Observation, Tool Review, Story / Behind the Scenes
- [ ] Each template card: category icon, title, description, example post (50-word preview), "Use template" button
- [ ] "Use template" navigates to content generator with template fields pre-populated in instructions field
- [ ] 8 built-in templates (one per category) — copy written for developer persona
- [ ] "Save as template" button in content generator: saves current instructions + topic + tone as custom template
- [ ] Custom templates shown in a "My Templates" section on /templates page
- [ ] Delete custom template (with confirmation)

**Dependencies:** None  
**Sprint:** S6

---

#### US-054: Mobile layout polish for core flows
**As a** user  
**I want to** use the core app features on my phone  
**So that** I can review and approve drafts and check analytics on the go

**Acceptance Criteria:**
- [ ] Sidebar collapses to bottom navigation bar on screens < 768px
- [ ] Bottom nav shows: Home, Create, Calendar, Engage, Profile — icons with labels
- [ ] Content generator form: all inputs usable on mobile (no overlapping elements, inputs don't zoom on iOS)
- [ ] Draft review page: content readable and editable on 375px viewport
- [ ] Calendar: month view usable on mobile (touch targets ≥ 44px)
- [ ] Dashboard: KPI cards stack vertically on mobile
- [ ] No horizontal scroll on any core page at 375px viewport
- [ ] Analytics charts responsive (recharts ResponsiveContainer used)
- [ ] Extension-specific features labelled "Desktop Chrome only" on mobile

**Dependencies:** None  
**Sprint:** S6

---

## Sprint Summary

| Sprint | Duration | Key Deliverables | Stories |
|--------|----------|-----------------|---------|
| S1 | Weeks 1–2 | All foundation fixes — DB, calendar, settings, version history | US-001 to US-012 |
| S2 | Weeks 3–4 | LinkedIn OAuth, publishing, analytics pipeline | US-013 to US-025 |
| S3 | Weeks 5–6 | Real analytics dashboard, trends, post import | US-026 to US-030 |
| S4 | Weeks 7–8 | Comment drafting, inspiration library, feed insights | US-031 to US-037 |
| S5 | Weeks 9–10 | Chrome extension — scaffold, feed detection, comment overlay, capture | US-038 to US-048 |
| S6 | Weeks 11–12 | Persona maturity, emails, templates, mobile polish | US-049 to US-054 |

**Total User Stories: 54**
