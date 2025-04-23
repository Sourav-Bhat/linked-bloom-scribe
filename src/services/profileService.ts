import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { User } from "firebase/auth";

/**
 * Save or update user profile and preferences.
 * Includes: name, industry, role, topics, postsPerWeek, tone, etc.
 */
export const saveUserProfile = async (userId: string, data: any) => {
  await setDoc(doc(db, "users", userId), {
    ...data,
    updatedAt: new Date()
  }, { merge: true });
};

/**
 * Load user profile and preferences from Firestore.
 */
export const getUserProfile = async (userId: string) => {
  const docRef = doc(db, "users", userId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
};
