# LinkedBloom — Admin Console

A standalone admin panel for the LinkedBloom closed beta: approve the waitlist,
monitor the user base, and view signup analytics. It's a separate Vite + React
app that shares the **same Firebase project** (`contentmanager-ed707`), Auth, and
`setUserAccess` Cloud Function as the main app, and deploys to its **own Firebase
Hosting site** so it's isolated from the public app.

## What it does
- **Dashboard** — totals (users / pending / approved / onboarded) + recent signups.
- **Waitlist** — pending users with one-click **Approve / Reject** (calls `setUserAccess`).
- **Users** — the whole user base: search, filter by status, approve/reject.
- **Analytics** — signups over the last 14 days + access-status breakdown (extensible).
- **Account** — send yourself a password-reset email (to change the temp password).

## Security model
- Only users with the Firebase **`admin` custom claim** can use it. The login screen
  rejects non-admins; routing renders an "Access denied" page as a backstop.
- All reads come from Firestore under the existing rules (`isAdmin()` can read/list any
  user). Approvals go through the admin-only `setUserAccess` function, which authorizes the
  caller by their **`admin` custom claim** (with the `ADMIN_UIDS` env allowlist as a
  bootstrap fallback for the first admin). The admin panel never elevates privileges itself.

## How environments are selected (no env files needed)
`src/lib/firebase.ts` switches automatically:
- **`npm run dev`** → connects to the **local Firebase Emulator Suite** (`demo-linkedbloom`,
  ports 9099/5001/8088) — the same one the main app uses.
- **`npm run build`** → the **production** project (`contentmanager-ed707`).

Firebase web config values are public/safe by design, so they're committed inline.

---

## Run locally (against the emulators)

From the repo root, start the main app's emulators (they hold the shared data):
```bash
npm run emulators          # in the repo root — Auth/Firestore/Functions on demo-linkedbloom
```
Then, in this folder:
```bash
cd admin
npm install
npm run dev                # http://localhost:5174
```

You'll need a **local admin** account in the emulator. Sign up any account (via the main
app at :8081, or the Auth emulator), then grant it admin:
```bash
# from repo root
FIRESTORE_EMULATOR_HOST=localhost:8088 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
  GCLOUD_PROJECT=demo-linkedbloom \
  node functions/scripts/grant-access.js <that-uid> --admin
```
Now sign in to the admin panel with that account. Create a few signups in the main app to
see them appear on the Waitlist.

---

## Deploy to production (separate Hosting site)

One-time: create the admin hosting site (globally-unique id; `linkedbloom-admin` is
referenced in `firebase.json`):
```bash
firebase hosting:sites:create linkedbloom-admin --project contentmanager-ed707
```
(If that id is taken, pick another and update `"site"` in `admin/firebase.json`.)

Then build + deploy (this does **not** touch the main app's hosting):
```bash
cd admin
npm install
npm run build
firebase deploy --only hosting --project contentmanager-ed707
```
Your console will be at **https://linkedbloom-admin.web.app**.

> Note: `firebase deploy` here uses **this folder's** `firebase.json` (which pins
> `"site": "linkedbloom-admin"`), so it only deploys the admin site. The main app is
> deployed separately by the root CI on pushes to `main`.

---

## Admin credentials
The admin account is the project owner's email. A **temporary password** is set on it via
the Admin SDK (see the chat / handoff note). **Change it immediately** after first login:
Account → *Send password reset email* (or "Forgot / change password?" on the login screen).

Approvals can also be done without the UI:
```bash
ID_TOKEN="<an admin's Firebase ID token>"
curl -X POST https://contentmanager-ed707.web.app/setUserAccess \
  -H "Authorization: Bearer $ID_TOKEN" -H "Content-Type: application/json" \
  -d '{"uid":"<target-uid>","action":"approve"}'
```

## Future analytics
The Analytics page derives everything client-side from the `users` collection. As you add
events (logins, generations, publishes), aggregate them into Firestore (e.g. a daily
`stats` doc via a scheduled function) and add cards/charts here.
