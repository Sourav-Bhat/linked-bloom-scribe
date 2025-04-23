import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

/**
 * Save generated content with status: 'draft', 'final', or 'scheduled'.
 * @param userId
 * @param content
 * @returns
 */
export const saveGeneratedContent = async (userId: string, content: any) => {
  return await addDoc(collection(db, "posts"), {
    ...content,
    userId,
    status: content.status || "draft",
    createdAt: new Date(),
    updatedAt: new Date()
  });
};

/**
 * Get contents by user, optionally filter by status.
 * @param userId
 * @param status optional -- "draft", "final", "scheduled", etc.
 */
export const getUserContents = async (userId: string, status?: string) => {
  let q = query(collection(db, "posts"), where("userId", "==", userId));
  if (status) {
    q = query(q, where("status", "==", status));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Update content status (to 'final', 'scheduled', etc)
 * @param postId
 * @param status
 */
export const updateContentStatus = async (postId: string, status: string) => {
  const docRef = doc(db, "posts", postId);
  await updateDoc(docRef, { status, updatedAt: new Date() });
};

/**
 * Update content fields. Used for editing, scheduling etc.
 * @param postId
 * @param data
 */
export const updateContent = async (postId: string, data: any) => {
  const docRef = doc(db, "posts", postId);
  await updateDoc(docRef, { ...data, updatedAt: new Date() });
};
