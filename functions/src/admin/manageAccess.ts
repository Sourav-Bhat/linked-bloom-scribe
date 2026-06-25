import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { baseHttpsOptions } from '../utils/httpsOptions';
import { queueEmail } from '../utils/email';

const adminUids = (): string[] =>
  (process.env.ADMIN_UIDS || '').split(',').map((s) => s.trim()).filter(Boolean);

/**
 * Admin-only: approve or reject a user for the closed beta.
 * Authorized for callers who carry the `admin` custom claim OR whose uid is in
 * the ADMIN_UIDS allowlist (the allowlist lets the very first admin call it
 * before any claim exists).
 * Body: { uid: string, action: "approve" | "reject" }.
 */
const handler = async (req: Request, res: Response): Promise<void> => {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  await new Promise<void>((resolve, reject) =>
    verifyToken(req, res, (err?: any) => (err ? reject(err) : resolve()))
  );
  if (res.headersSent) return;

  const callerUid: string = (req as any).uid;
  const isAdminClaim: boolean = (req as any).isAdmin === true;
  if (!isAdminClaim && !adminUids().includes(callerUid)) {
    res.status(403).json({ error: 'Not authorized to manage access.' });
    return;
  }

  const { uid, action } = req.body as { uid?: string; action?: string };
  if (!uid || (action !== 'approve' && action !== 'reject')) {
    res.status(400).json({ error: 'Provide { uid, action: "approve" | "reject" }.' });
    return;
  }

  const db = admin.firestore();
  try {
    if (action === 'approve') {
      await admin.auth().setCustomUserClaims(uid, { approved: true });
      await db.doc(`users/${uid}`).set(
        { accessStatus: 'approved', approvedAt: new Date().toISOString() },
        { merge: true },
      );
      const userRec = await admin.auth().getUser(uid).catch(() => null);
      if (userRec?.email) {
        if (userRec.emailVerified) {
          // Google / already-verified — straight to access.
          await queueEmail(
            userRec.email,
            "You're approved — welcome to LinkedBloom",
            `<p>Good news — your LinkedBloom access has been approved. 🎉</p>
             <p><strong>Sign in again</strong> to set up your persona and start posting.</p>`,
          );
        } else {
          // Email/password — must verify ownership before access. Include a link.
          let link = '';
          try { link = await admin.auth().generateEmailVerificationLink(userRec.email); } catch { /* best effort */ }
          await queueEmail(
            userRec.email,
            "You're approved — verify your email to get started",
            `<p>Good news — your LinkedBloom access has been approved. 🎉</p>
             <p>One last step: <strong>verify your email</strong> to unlock the platform.</p>
             ${link ? `<p><a href="${link}">Verify my email →</a></p>` : '<p>Sign in and follow the prompt to verify your email.</p>'}`,
          );
        }
      }
    } else {
      await admin.auth().setCustomUserClaims(uid, { approved: false });
      await db.doc(`users/${uid}`).set({ accessStatus: 'rejected', approvedAt: null }, { merge: true });
    }
    res.json({ ok: true, uid, action });
  } catch (err: any) {
    console.error('setUserAccess error', err);
    res.status(500).json({ error: err?.message ?? 'Failed to update access.' });
  }
};

export const setUserAccess = onRequest(baseHttpsOptions, handler as any);
