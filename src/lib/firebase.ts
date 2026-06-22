import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Which environment this build is wired to. Set via VITE_APP_ENV in the
// per-mode env file (.env.development / .env.production). Defaults to
// 'development' so an unconfigured build surfaces the DEV indicator rather
// than masquerading as production.
export const APP_ENV = import.meta.env.VITE_APP_ENV ?? 'development';
export const IS_PRODUCTION = APP_ENV === 'production';

if (typeof console !== 'undefined') {
  console.info(`[LinkedBloom] env=${APP_ENV} firebaseProject=${firebaseConfig.projectId ?? '(unset)'}`);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
