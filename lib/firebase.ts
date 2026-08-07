// lib/firebase.ts
// ─────────────────────────────────────────────────────────────────────────────
// Replace placeholder values with your Firebase project credentials:
// https://console.firebase.google.com → Project Settings → Your apps → Web app
// ─────────────────────────────────────────────────────────────────────────────

// Imported from @firebase/* directly (not the `firebase/*` wrapper packages):
// the wrapper's package.json exports maps don't forward Metro's "react-native"
// condition, so `firebase/app` and `@firebase/auth` (via `firebase/auth`) end
// up resolved as separate ESM/CJS module instances with separate component
// registries, causing "Component auth has not been registered yet". Importing
// the @firebase/* packages directly keeps everything on one module instance.
// See firebase/firebase-js-sdk#7615.
import { initializeApp, getApps, getApp } from '@firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from '@firebase/firestore';
import { getStorage } from '@firebase/storage';

const firebaseConfig = {
   apiKey: "AIzaSyD3hwZ_9RjDYsFKmxi1_FKf2Y_OZNQ2cEY",
  authDomain: "kosso-gym.firebaseapp.com",
  projectId: "kosso-gym",
  storageBucket: "kosso-gym.firebasestorage.app",
  messagingSenderId: "189748903908",
  appId: "1:189748903908:web:35489e627d6423783c91f1"

};

// Only initialize once — safe across hot reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// initializeAuth may only be called once per app instance
// The try/catch handles the hot-reload case where it was already called
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
