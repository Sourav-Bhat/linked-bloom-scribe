import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { baseHttpsOptions } from '../utils/httpsOptions';
import { queueEmail } from '../utils/email';

const adminUids = (): string[] =>
  (process.env.ADMIN_UIDS || '').split(',').map((s) => s.trim()).filter(Boolean);

/**
 * Admin-only: (re)issue an email-verification ("activation") link for a user.
 * Returns the link so the admin panel can show/copy it (works with no email
 * infrastructure), and ALSO best-effort queues an email with the link so it is
 * delivered automatically if a Trigger-Email/SMTP sender is ever configured.
 * Authorized by the `admin` claim or the ADMIN_UIDS allowlist.
 * Body: { uid: string }.
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

  const { uid } = req.body as { uid?: string };
  if (!uid) {
    res.status(400).json({ error: 'Provide { uid }.' });
    return;
  }

  try {
    const userRec = await admin.auth().getUser(uid);
    if (!userRec.email) {
      res.status(400).json({ error: 'User has no email address.' });
      return;
    }
    if (userRec.emailVerified) {
      res.json({ ok: true, alreadyVerified: true, email: userRec.email });
      return;
    }

    const link = await admin.auth().generateEmailVerificationLink(userRec.email);

    // Best-effort delivery (no-op until a sender is configured).
    await queueEmail(
      userRec.email,
      'Activate your LinkedBloom account',
      `<p>Verify your email to activate your LinkedBloom account.</p>
       <p><a href="${link}">Activate my account →</a></p>
       <p style="color:#888;font-size:12px">If you didn't request this, you can ignore this email.</p>`,
    );

    res.json({ ok: true, email: userRec.email, link });
  } catch (err: any) {
    console.error('resendActivation error', err);
    res.status(500).json({ error: err?.message ?? 'Failed to issue activation link.' });
  }
};

export const resendActivation = onRequest(baseHttpsOptions, handler as any);
