import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  const idToken = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    (req as any).uid = decoded.uid;
    (req as any).email = decoded.email ?? '';
    (req as any).approved = decoded.approved === true;
    (req as any).isAdmin = decoded.admin === true;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Call inside a handler (after verifyToken) to block users who haven't been
 * approved for the closed beta. Returns true if the response was already sent.
 */
export const rejectIfNotApproved = (req: Request, res: Response): boolean => {
  if (!(req as any).approved) {
    res.status(403).json({ error: 'Your account is pending approval for the closed beta.' });
    return true;
  }
  return false;
};
