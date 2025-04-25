
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { ContentPost } from "@/lib/types";

/**
 * Save generated content with status: 'draft', 'final', or 'scheduled'.
 */
export const saveGeneratedContent = async (userId: string, content: Partial<ContentPost>) => {
  try {
    // Use user's posts subcollection
    const userPostsRef = collection(db, "users", userId, "posts");
    
    const postData = {
      ...content,
      userId,
      status: content.status || "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return await addDoc(userPostsRef, postData);
  } catch (error) {
    console.error("Error saving content:", error);
    throw error;
  }
};

/**
 * Get contents by user, optionally filter by status.
 */
export const getUserContents = async (userId: string, status?: string) => {
  try {
    const userPostsRef = collection(db, "users", userId, "posts");
    let q = query(userPostsRef);
    
    if (status) {
      q = query(userPostsRef, where("status", "==", status));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ContentPost[];
  } catch (error) {
    console.error("Error fetching content:", error);
    throw error;
  }
};

/**
 * Update content status (to 'final', 'scheduled', etc)
 */
export const updateContentStatus = async (userId: string, postId: string, status: string) => {
  try {
    const docRef = doc(db, "users", userId, "posts", postId);
    await updateDoc(docRef, { 
      status, 
      updatedAt: new Date().toISOString() 
    });
  } catch (error) {
    console.error("Error updating content status:", error);
    throw error;
  }
};

/**
 * Update content fields. Used for editing, scheduling etc.
 */
export const updateContent = async (userId: string, postId: string, data: Partial<ContentPost>) => {
  try {
    const docRef = doc(db, "users", userId, "posts", postId);
    await updateDoc(docRef, { 
      ...data, 
      updatedAt: new Date().toISOString() 
    });
  } catch (error) {
    console.error("Error updating content:", error);
    throw error;
  }
};
