import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

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
