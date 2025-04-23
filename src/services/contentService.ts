
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

export const saveGeneratedContent = async (userId: string, content: any) => {
  return await addDoc(collection(db, "posts"), {
    ...content,
    userId,
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date()
  });
};

export const getUserContents = async (userId: string, status?: string) => {
  let q = query(collection(db, "posts"), where("userId", "==", userId));
  if (status) {
    q = query(q, where("status", "==", status));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateContentStatus = async (postId: string, status: string) => {
  const docRef = doc(db, "posts", postId);
  await updateDoc(docRef, { status, updatedAt: new Date() });
};

export const updateContent = async (postId: string, data: any) => {
  const docRef = doc(db, "posts", postId);
  await updateDoc(docRef, { ...data, updatedAt: new Date() });
};
