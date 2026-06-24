# Current State — Implemented & Tested

**As of:** 23 Jun 2026 · **Branch:** `dev` (code committed in `bd64e69`)
**Scope:** What exists and has been verified after Sprint 1, Sprint 2, and the P1 PR Agent work. "Tested" = exercised live in the running app (Firebase emulators) via the browser, unless noted.

---

## A. End-to-end user journeys that work today

1. **Define your voice (Persona).** View your generated persona — archetype + tagline, 3 content pillars (each with a first-post idea), recommended posting rhythm, and voice profile (tone / style / things-to-avoid). *(Pre-existing; unchanged.)*

2. **Strategize with the PR Agent.** Open the PR Agent → pick a session mode (Discovery / Brainstorm / Strategy / Accountability) → converse. The agent **remembers the whole conversation**, asks sharp persona-aware questions, steers, and stays concise. From any agent reply, **"Turn into a post"** hands the idea to the Generator. *Tested: multi-turn recall, mode switching, handoff.*

3. **Create a post.** Enter topic / instructions / tone / length → Generate → see a **LinkedIn-accurate preview** (no markdown, "…see more" fold) with a **word-count vs. target** badge → **Copy for LinkedIn** or **Save as draft**. *Tested: 141-word "on target" Medium post, clean formatting, copy, save.*

4. **Schedule a post.** From a draft → **Schedule** (date/time, pre-filled to tomorrow 09:00) → the post moves to `scheduled` and appears on the Calendar. *Tested end-to-end: draft → scheduled → 6/24 09:00 on calendar.*

5. **Track your pipeline.** Dashboard (counts, next post, upcoming) and Calendar (month view, per-day posts, unschedule) read from **one source of truth** and agree. *Tested: Dashboard and Calendar consistent; mock data removed.*

---

## B. Features implemented & tested, by area

### Generation (Sprint 1)
- Removed the OpenAI **API-key tab**; generation runs server-side via Gemini. *(Tested: Profile now shows 3 tabs.)*
- New `src/lib/postFormat.ts`: markdown → **LinkedIn-safe text** (Unicode bold, strips `#`/backticks, bullets → `•`), word count, length bands, copy builder.
- **LinkedIn preview card** with avatar/headline and "…see more" fold. *(Tested.)*
- **Copy for LinkedIn** button (cleaned body + hashtags) with toast. *(Tested.)*
- **Length enforcement** — backend bands now match the UI (Short 50–100 / Medium 100–200 / Long 200–300); word-count badge shows on/off target. *(Tested: 141 words for Medium.)*
- **Persona-wired generation** — backend reads `personaData` (archetype, pillars, voice, things-to-avoid). *(Implemented + compiled; generation succeeds.)*
- **Tone taxonomy unified** to Professional / Conversational / Storytelling across Profile + Generator. *(Tested: dropdown.)*

### Workflow & data (Sprint 2)
- `scheduleContent` / `unscheduleContent` services; post state machine `draft → scheduled → published`.
- **ScheduleDialog** (date/time picker, rhythm-prefilled). *(Tested.)*
- **Calendar rewritten to real Firestore data** — removed the hardcoded April-2025 mock array. *(Tested.)*
- **Dashboard reconciled** — scheduled-only "upcoming," current-month count, single empty state; agrees with Calendar. *(Tested: 0-vs-2 disconnect fixed.)*
- Drafts list filtered to true drafts; crafted empty state. *(Tested.)*

### PR Agent (P1)
- **Full conversation history** now sent to the model (was stateless). *(Tested: recalled "40% cloud cost reduction" across turns.)*
- **Socratic strategist** system prompt — one sharp question at a time, candid, persona-aware, steers drift, guides toward posting. *(Tested.)*
- **Session modes** (Discovery / Brainstorm / Strategy / Accountability) that change behavior. *(Tested.)*
- Suggestion **chips send on click** (fixed the old fill-and-duplicate bug); send/clear controls **labeled** (a11y). *(Tested.)*
- **"Turn into a post"** handoff → Generator pre-filled via `?topic` / `?instructions`. *(Tested.)*
- **Product name unified** to "LinkedBloom" (was "LinkedIn Content Manager" / "LCM"). *(Tested: header.)*

### Verification performed
- TypeScript: `tsc --noEmit` clean on **app** and **functions**.
- ESLint: clean on all new files (remaining `any` warnings are pre-existing patterns).
- Live browser walkthrough of every journey above.

---

## C. Known gaps / not yet built (honesty section)

- **Publishing is still manual** — "copy + paste to LinkedIn" (no API publish). Reminders not built yet.
- **Not built:** Google Calendar sync + night-before reminder, browser extension, analytics ingestion, blogs/whitepapers, AI video/images, multi-platform, project/job/skill-gap.
- **Loose ends:** one legacy test post stuck in old `final` status in the emulator; `ApiKeySettings.tsx` left in the tree but unused; mobile responsive nav not yet addressed; broader UI/UX design-system pass pending.
- **Build caveat:** `npm run build` (rollup) and `git commit` of new docs must run on the Mac — the Linux sandbox can't run the platform-native rollup binary or write through the host git lock.
