import * as admin from 'firebase-admin';

/**
 * Queue a transactional email by writing to the `mail` collection in the format
 * the Firebase "Trigger Email" extension consumes. If the extension isn't
 * installed the doc simply sits there (no error) — install it + set ADMIN_EMAIL
 * to actually send. (Swap this for Nodemailer + SMTP secrets if you prefer.)
 */
export async function queueEmail(to: string, subject: string, html: string): Promise<void> {
  if (!to) return;
  try {
    await admin.firestore().collection('mail').add({ to, message: { subject, html } });
  } catch (err) {
    console.error('queueEmail failed', err);
  }
}
