/*
 * Grant beta access (and optionally admin) to a user via the Admin SDK.
 * Sets the `approved` (and `admin`) custom claims and marks users/{uid} approved.
 * The user must re-login (or hit "Refresh status") to pick up the new claim.
 *
 * Production:
 *   GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json" \
 *   node functions/scripts/grant-access.js <uid> [--admin]
 *
 * Local emulator:
 *   FIRESTORE_EMULATOR_HOST=localhost:8088 \
 *   FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
 *   GCLOUD_PROJECT=demo-linkedbloom \
 *   node functions/scripts/grant-access.js <uid> [--admin]
 */
const admin = require('firebase-admin');

const uid = process.argv[2];
const makeAdmin = process.argv.includes('--admin');
if (!uid) {
  console.error('Usage: node functions/scripts/grant-access.js <uid> [--admin]');
  process.exit(1);
}

if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-linkedbloom' });
} else {
  admin.initializeApp(); // uses GOOGLE_APPLICATION_CREDENTIALS
}

(async () => {
  const claims = { approved: true };
  if (makeAdmin) claims.admin = true;
  await admin.auth().setCustomUserClaims(uid, claims);
  await admin.firestore().doc(`users/${uid}`).set(
    { accessStatus: 'approved', approvedAt: new Date().toISOString() },
    { merge: true },
  );
  console.log(`Granted ${JSON.stringify(claims)} to ${uid}.`);
  console.log('The user must re-login (or click "Refresh status") to pick up the claim.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
