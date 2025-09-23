
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, indexedDBLocalPersistence, inMemoryPersistence, type Auth } from "firebase/auth";
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

let app: FirebaseApp;
let auth: Auth | null;
let db: Firestore | null = null;


// Initialize Firebase
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn("Firebase configuration is incomplete. Firebase services will be disabled. Please set up your .env.local file with all the required NEXT_PUBLIC_FIREBASE_... variables.");
    app = null!;
    auth = null;
    db = null;
} else {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);

    // Initialize Auth client-side only to avoid SSR issues
    auth = typeof window !== 'undefined' ? initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, inMemoryPersistence]
    }) : null;

    // Initialize App Check on the client side only
    if (typeof window !== 'undefined') {
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
}

export { app, auth, db };
