## Why the preview is blank

`src/App.tsx` calls `onAuthStateChanged(auth, …)` at mount. `src/lib/firebase.ts` runs `initializeApp({ apiKey: import.meta.env.VITE_FIREBASE_API_KEY, … })` — but no `VITE_FIREBASE_*` vars exist in this project. Firebase throws synchronously on init, React never mounts, `#root` stays empty.

You don't have the Firebase config handy and the project is already mid-migration to Lovable Cloud (Supabase edge functions deployed, `@supabase/supabase-js` installed, `src/integrations/supabase/client.ts` in place). So the right unblock is to finish flipping the auth bootstrap to Supabase instead of resurrecting Firebase.

## Plan

1. **Rewrite `src/App.tsx` auth bootstrap**
   - Replace `onAuthStateChanged` + Firestore `getDoc` with Supabase:
     - `supabase.auth.getSession()` on mount
     - `supabase.auth.onAuthStateChange((_event, session) => …)` listener
   - Replace the Firestore `users/{uid}.onboardingCompleted` read with a `profiles` row read: `supabase.from('profiles').select('onboarding_completed').eq('id', session.user.id).maybeSingle()`.
   - Change `AuthContext` user type from Firebase `User` to Supabase `User` (`@supabase/supabase-js`). Keep the same shape (`{ user, setOnboardingCompleted }`) so consumers via `useAuth()` keep working.

2. **Update `src/features/auth/LoginPage.tsx`** to call Supabase (`signInWithPassword`, `signUp`, `signInWithOAuth({ provider: 'google' })`, `signOut`) instead of the Firebase helpers in `authService.ts`. Keep the existing form UI.

3. **Adapt callers that read `user.uid`** to use `user.id` (Supabase). Touch points: `ProfilePage.tsx`, `GeneratorPage.tsx`, `DashboardPage.tsx`, `CalendarPage.tsx`, `ReviewPage.tsx`, `OnboardingPage.tsx`, `Navbar.tsx`, `Sidebar.tsx`. This is a mechanical `user.uid` → `user.id` swap; no business-logic changes.

4. **Add `profiles.onboarding_completed` column** if it isn't already there (migration), so the gating in App.tsx works. Existing `handle_new_user()` trigger already inserts a row per signup — we just add the boolean (default false) and update it from the existing onboarding flow's final step.

5. **Update `OnboardingPage.tsx`'s "complete" handler** to `supabase.from('profiles').update({ onboarding_completed: true })` instead of Firestore, and call `setOnboardingCompleted(true)` from context as today.

6. **Leave the Firebase files in place but unused** (`src/lib/firebase.ts`, `src/features/auth/authService.ts`, Firestore-based `profileService.ts`/`contentService.ts`/`linkedinService.ts`). They are not imported after step 1–3 so the app boots. Full removal + Firestore→Postgres data-model migration is a follow-up — flagged below.

7. **Verify**: after edits, refresh the preview, check console for clean mount, confirm `/login` renders and that signing in with the test account `aabb@abc.com / 123456` reaches the dashboard (creating the Supabase user first if needed).

## Out of scope (follow-ups)

- Migrating `contentService` / `profileService` / `linkedinService` off Firestore onto Supabase tables — needed before Generator/Profile/Calendar features actually work end-to-end, but not required to unblock the preview.
- Wiring `useContentGeneration` to the new `generate-content` edge function (was started last session; still pending).
- Deleting `src/lib/firebase.ts` and Firebase deps once nothing imports them.

## Technical notes

- Supabase client already exported from `@/integrations/supabase/client`.
- For the migration use the standard Supabase pattern: `CREATE TABLE` already exists for `profiles`; just `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;`. Existing RLS policies on `profiles` cover the new column.
- Set up auth listener before the `getSession()` call to avoid race conditions, per Supabase guidance.
