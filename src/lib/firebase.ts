
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration for Content Manager
const firebaseConfig = {
  apiKey: "AIzaSyDngAgRX6coWLm7o8lDZQoRWf296YULFKc",
  authDomain: "contentmanager-ed707.firebaseapp.com",
  projectId: "contentmanager-ed707",
  storageBucket: "contentmanager-ed707.firebasestorage.app",
  messagingSenderId: "148543931888",
  appId: "1:148543931888:web:30bc6667b560e5fb490935"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();

export default app;
