
import { 
  auth, 
  googleProvider, 
  db 
} from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { checkUserCollections, initializeUserCollections } from './profileService';

// Register user with email and password
export const registerWithEmail = async (email: string, password: string): Promise<User | null> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if user collections exist and create if they don't
    const userExists = await checkUserCollections(userCredential.user.uid);
    if (!userExists) {
      await createUserProfile(userCredential.user);
    }
    
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    
    // Check if user collections exist and create if they don't
    const userExists = await checkUserCollections(userCredential.user.uid);
    if (!userExists) {
      await createUserProfile(userCredential.user);
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    
    // Check specifically for unauthorized domain error
    if (error.code === 'auth/unauthorized-domain') {
      // Log the current domain
      console.log('Current Domain:', window.location.origin);
      
      const errorWithInstructions = new Error(
        `This domain (${window.location.origin}) is not authorized for Google sign-in. Please add this domain to your Firebase console under Authentication > Sign-in method > Google > Authorized domains.`
      );
      throw errorWithInstructions;
    }
    
    throw error;
  }
};

// Create user profile in Firestore
const createUserProfile = async (user: User) => {
  try {
    const userData = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Initialize the main user document and all subcollections
    await initializeUserCollections(user.uid, userData);
  } catch (error) {
    console.error("Error creating user profile:", error);
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
