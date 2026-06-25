import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

/**
 * Ensure the user's access record exists in Firestore (the admin queue mirror).
 * - First sign-in (any method): create users/{uid} with accessStatus:"pending".
 * - Every subsequent login: bump lastLoginAt only.
 * The authoritative access gate is the `approved` custom claim, not this doc —
 * so failures here are non-fatal. Rules permit the pending create and the
 * lastLoginAt bump; they never let the client change accessStatus.
 */
export const ensureAccessRecord = async (user: User): Promise<void> => {
  const ref = doc(db, 'users', user.uid);
  const provider = user.providerData[0]?.providerId ?? 'password';
  const nowIso = new Date().toISOString();
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        email: user.email ?? '',
        displayName: user.displayName ?? '',
        signUpProvider: provider,
        accessStatus: 'pending',
        approvedAt: null,
        createdAt: nowIso,
        lastLoginAt: nowIso,
      });
    } else {
      await updateDoc(ref, { lastLoginAt: nowIso });
    }
  } catch (err) {
    console.warn('ensureAccessRecord: could not upsert access record', err);
  }
};

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signInWithGoogle = () =>
  signInWithPopup(auth, googleProvider);

export const signOut = () => firebaseSignOut(auth);

export const onAuthStateChange = (cb: (user: User | null) => void) =>
  onAuthStateChanged(auth, cb);

export const getCurrentUser = () => auth.currentUser;

export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};
