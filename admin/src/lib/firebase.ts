import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// `npm run dev` -> talk to the local Firebase Emulator Suite (same one the main
// app uses, project "demo-linkedbloom"). `npm run build` -> the real prod project.
// Firebase web config values are public/safe by design.
export const USE_EMULATORS = import.meta.env.DEV;

const firebaseConfig = USE_EMULATORS
  ? {
      apiKey: "demo-key",
      authDomain: "localhost",
      projectId: "demo-linkedbloom",
      storageBucket: "demo-linkedbloom.appspot.com",
      appId: "demo-admin",
    }
  : {
      apiKey: "AIzaSyDngAgRX6coWLm7o8lDZQoRWf296YULFKc",
      authDomain: "contentmanager-ed707.firebaseapp.com",
      projectId: "contentmanager-ed707",
      storageBucket: "contentmanager-ed707.firebasestorage.app",
      messagingSenderId: "148543931888",
      appId: "1:148543931888:web:30bc6667b560e5fb490935",
    };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Cloud Functions base URL (absolute — the admin app is on a different origin,
// so it can't use same-origin Hosting rewrites; setUserAccess has cors:true).
export const FUNCTIONS_BASE_URL = USE_EMULATORS
  ? "http://localhost:5001/demo-linkedbloom/us-central1"
  : "https://us-central1-contentmanager-ed707.cloudfunctions.net";

if (USE_EMULATORS && !(globalThis as any).__adminEmu) {
  (globalThis as any).__adminEmu = true;
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8088);
  // eslint-disable-next-line no-console
  console.info("[admin] connected to local Firebase emulators (demo-linkedbloom)");
}
