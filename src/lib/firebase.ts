
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Only initialize Firebase if all the required keys are present
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    // Initialize App Check on the client side only
    if (typeof window !== 'undefined') {
        // Set the debug token in development
        if (process.env.NODE_ENV === 'development') {
          (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        }
        
        const reCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
        if (reCaptchaKey) {
            try {
                initializeAppCheck(app, {
                    provider: new ReCaptchaV3Provider(reCaptchaKey),
                    isTokenAutoRefreshEnabled: true
                });
                console.log("Firebase App Check initialized.");
            } catch (e) {
                console.error("Failed to initialize Firebase App Check", e);
            }
        } else {
            console.warn("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. App Check will not be enabled.");
        }
    }
} else {
    console.warn("Firebase configuration is incomplete. Firebase services will be disabled. Please set up your .env.local file with all the required NEXT_PUBLIC_FIREBASE_... variables.");
}

export { app, auth, db };
