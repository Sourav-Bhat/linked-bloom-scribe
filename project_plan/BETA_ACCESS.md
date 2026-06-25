# Closed-Beta Access Gate

Access is gated by a Firebase **custom claim `approved`** (authoritative), mirrored
in Firestore `users/{uid}.accessStatus` for the admin queue. Admins carry an extra
`admin` claim.

## Flow
1. User signs up (email/password or Google) → `users/{uid}` is created with
   `accessStatus:"pending"` (client-side `ensureAccessRecord`). No `approved` claim.
2. They land on **/pending** (the waitlist screen) — routing blocks onboarding/app.
3. The `onUserSignup` Firestore trigger emails `ADMIN_EMAIL` ("New beta signup").
4. Admin approves → `setUserAccess` sets `approved:true` claim + `accessStatus:"approved"`
   and emails the user.
5. User signs in again (or clicks **Refresh status**, which force-refreshes the token)
   → claim present → onboarding/app unlocked.

Enforcement is server-side: Firestore/Storage **rules** require `request.auth.token.approved == true`
for all app data, and the AI functions reject unapproved callers (`rejectIfNotApproved`).

## Bootstrap the first admin (so you're never locked out)
Find your uid (Firebase Console → Authentication), then:

```bash
# Production
GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json" \
  node functions/scripts/grant-access.js <your-uid> --admin

# Local emulator
FIRESTORE_EMULATOR_HOST=localhost:8088 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
  GCLOUD_PROJECT=demo-linkedbloom \
  node functions/scripts/grant-access.js <your-uid> --admin
```
`--admin` adds the `admin` claim (read/manage any user). Re-login to pick up claims.

## Config (functions env)
| Var | Purpose |
|--|--|
| `ADMIN_EMAIL` | recipient of "new signup" notifications |
| `ADMIN_UIDS` | comma-separated uids allowed to call `setUserAccess` |

- **Local:** `functions/.env.local` (gitignored).
- **Prod:** GitHub Actions secrets `ADMIN_EMAIL` / `ADMIN_UIDS` → written to `functions/.env` by `deploy.yml`.

## Approving users in production
Either run the bootstrap script for a uid, or POST to the callable endpoint as an admin:

```bash
ID_TOKEN="<an admin user's Firebase ID token>"
curl -X POST https://contentmanager-ed707.web.app/setUserAccess \
  -H "Authorization: Bearer $ID_TOKEN" -H "Content-Type: application/json" \
  -d '{"uid":"<target-uid>","action":"approve"}'   # or "reject"
```

## Emails
Uses the Firebase **Trigger Email** extension format — functions write to the `mail`
collection `{ to, message: { subject, html } }`. Install the extension and configure
SMTP for emails to actually send; without it, the docs queue harmlessly (no errors).

## Prod deploy prerequisites
Before/with `firebase deploy --only hosting,functions,firestore:rules`:
1. Bootstrap your own uid (`--admin`) so the new rules don't lock you out.
2. Set `ADMIN_EMAIL` / `ADMIN_UIDS` GitHub secrets.
3. (Optional) Install the Trigger Email extension + SMTP.
