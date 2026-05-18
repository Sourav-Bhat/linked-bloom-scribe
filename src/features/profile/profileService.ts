import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const getUserProfile = async (userId: string) => {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const saveUserProfile = async (userId: string, data: any) => {
  await setDoc(doc(db, 'users', userId), {
    ...data,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  return true;
};

export const hasCompletedOnboarding = async (userId: string) => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.data()?.onboardingCompleted ?? false;
};

export const checkUserCollections = async (userId: string) => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists();
};

export const hasCompletedProfile = async (userId: string) => {
  const snap = await getDoc(doc(db, 'users', userId));
  return !!(snap.data()?.fullName);
};
