
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { User } from "firebase/auth";

/**
 * Check if user collections exist
 */
export const checkUserCollections = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists();
  } catch (error) {
    console.error("Error checking user collections:", error);
    return false;
  }
};

/**
 * Initialize user collections with default structure
 */
export const initializeUserCollections = async (userId: string, userData: any = {}) => {
  try {
    // Create main user document if it doesn't exist
    await setDoc(
      doc(db, "users", userId), 
      {
        email: userData.email || "",
        displayName: userData.displayName || "",
        photoURL: userData.photoURL || "",
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...userData
      }, 
      { merge: true }
    );
    
    // Initialize profile subcollection
    await setDoc(
      doc(db, "users", userId, "profile", "details"),
      {
        fullName: userData.displayName || "",
        jobTitle: "",
        company: "",
        industry: "",
        bio: "",
        topics: [],
        postsPerWeek: "3",
        tone: "professional",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );
    
    // Initialize posts collection (empty)
    await setDoc(
      doc(db, "users", userId, "analytics", "summary"),
      {
        postsCount: 0,
        engagementRate: 0,
        lastUpdated: new Date()
      }
    );
    
    return true;
  } catch (error) {
    console.error("Error initializing user collections:", error);
    return false;
  }
};

/**
 * Save or update user profile and preferences.
 * Includes: name, industry, role, topics, postsPerWeek, tone, etc.
 */
export const saveUserProfile = async (userId: string, data: any) => {
  try {
    // Update main user document
    await setDoc(
      doc(db, "users", userId), 
      {
        ...data,
        updatedAt: new Date()
      }, 
      { merge: true }
    );
    
    // Also update the profile subcollection
    await setDoc(
      doc(db, "users", userId, "profile", "details"),
      {
        ...data,
        updatedAt: new Date()
      },
      { merge: true }
    );
    
    return true;
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
};

/**
 * Load user profile and preferences from Firestore.
 */
export const getUserProfile = async (userId: string) => {
  try {
    // First check the main user document
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    // Also get profile details from subcollection
    const profileDoc = await getDoc(doc(db, "users", userId, "profile", "details"));
    
    // Combine data from both documents
    const userData = userDoc.data();
    const profileData = profileDoc.exists() ? profileDoc.data() : {};
    
    return {
      ...userData,
      ...profileData
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

/**
 * Check if user has completed onboarding
 */
export const hasCompletedOnboarding = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return userData.onboardingCompleted === true;
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return false;
  }
};
