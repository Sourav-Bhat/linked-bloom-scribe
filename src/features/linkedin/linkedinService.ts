
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface LinkedInPost {
  id: string;
  content: string;
  title?: string;
  hashtags?: string;
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'published';
  analytics?: {
    impressions?: number;
    engagements?: number;
    clicks?: number;
    comments?: number;
    reactions?: number;
  };
}

// Function to save LinkedIn token to user document
export const saveLinkedInToken = async (userId: string, token: string, expiresAt: number) => {
  try {
    await setDoc(doc(db, "users", userId), {
      linkedinToken: token,
      linkedinTokenExpiresAt: expiresAt,
      updatedAt: new Date()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving LinkedIn token:", error);
    return false;
  }
};

// Function to check if LinkedIn token is valid
export const isLinkedInTokenValid = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    const expiresAt = userData.linkedinTokenExpiresAt;
    
    return expiresAt > Date.now();
  } catch (error) {
    console.error("Error checking LinkedIn token:", error);
    return false;
  }
};

// Function to post content to LinkedIn
export const postToLinkedIn = async (userId: string, post: LinkedInPost) => {
  try {
    // Check if token is valid
    const isValid = await isLinkedInTokenValid(userId);
    if (!isValid) {
      throw new Error("LinkedIn token is invalid or expired");
    }
    
    // In a real application, this would make an API call to LinkedIn
    // This is a placeholder for the actual LinkedIn API integration
    console.log(`Posting to LinkedIn: "${post.content}"`);
    
    // Update post status in Firestore
    await updateDoc(doc(db, "posts", post.id), {
      status: 'published',
      publishedAt: new Date()
    });
    
    return {
      success: true,
      postId: post.id
    };
  } catch (error) {
    console.error("Error posting to LinkedIn:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

// Function to get LinkedIn post analytics
export const getPostAnalytics = async (userId: string, postId: string) => {
  try {
    // In a real application, this would make an API call to LinkedIn
    // This is a placeholder for the actual LinkedIn API analytics fetch
    
    // Mock data for demo purposes
    const analytics = {
      impressions: Math.floor(Math.random() * 10000),
      engagements: Math.floor(Math.random() * 1000),
      clicks: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 50),
      reactions: Math.floor(Math.random() * 200)
    };
    
    // Store analytics in Firestore
    await updateDoc(doc(db, "posts", postId), {
      analytics,
      lastAnalyticsUpdate: new Date()
    });
    
    return analytics;
  } catch (error) {
    console.error("Error getting LinkedIn analytics:", error);
    return null;
  }
};
