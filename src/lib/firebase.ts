import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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

// In dev, point the SDK at the local Firebase Emulator Suite so Auth, Firestore,
// and Storage are fully local — no cloud project touched. Enabled by
// VITE_USE_EMULATORS in .env.development. The globalThis guard prevents
// double-connecting across Vite HMR reloads.
export const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === 'true';
if (USE_EMULATORS && !(globalThis as any).__lbEmulatorsConnected) {
  (globalThis as any).__lbEmulatorsConnected = true;
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8088);
  connectStorageEmulator(storage, 'localhost', 9199);
  console.info('[LinkedBloom] connected to local Firebase emulators');
}

export default app;
