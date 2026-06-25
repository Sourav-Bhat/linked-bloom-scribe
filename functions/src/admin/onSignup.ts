import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { queueEmail } from '../utils/email';

/**
 * Notify the admin whenever a new access record is created (i.e. someone signs
 * up). The record is created client-side on first login (ensureAccessRecord).
 */
export const onUserSignup = onDocumentCreated('users/{uid}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log('onUserSignup: ADMIN_EMAIL not set — skipping notification');
    return;
  }

  const email = data.email || '(unknown email)';
  const provider = data.signUpProvider || 'unknown';
  const uid = event.params.uid;

  await queueEmail(
    adminEmail,
    `New LinkedBloom beta signup: ${email}`,
    `<p>A new user joined the LinkedBloom closed-beta waitlist.</p>
     <ul>
       <li><strong>Email:</strong> ${email}</li>
       <li><strong>Provider:</strong> ${provider}</li>
       <li><strong>UID:</strong> ${uid}</li>
     </ul>
     <p>Approve them via the <code>setUserAccess</code> function or by setting the
     <code>approved</code> custom claim.</p>`,
  );
});
