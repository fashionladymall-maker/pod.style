
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence, inMemoryPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

interface AppCheckDebugWindow extends Window {
  FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean;
}

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

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn("Firebase configuration is incomplete. Firebase services will be disabled. Please set up your .env.local file with all the required NEXT_PUBLIC_FIREBASE_... variables.");
} else {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }

    if (app) {
        db = getFirestore(app);

        if (typeof window !== 'undefined') {
            // Initialize Auth only on the client
            auth = initializeAuth(app, {
                persistence: [indexedDBLocalPersistence, inMemoryPersistence]
            });

            // Initialize App Check and handle errors gracefully
            if (process.env.NODE_ENV === 'development') {
              (window as AppCheckDebugWindow).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
            }
            
            const reCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
            if (reCaptchaKey) {
                try {
                    initializeAppCheck(app, {
                        provider: new ReCaptchaV3Provider(reCaptchaKey),
                        isTokenAutoRefreshEnabled: true
                    });
                    console.log("Firebase App Check initialized successfully.");
                } catch (e) {
                    console.error("Failed to initialize Firebase App Check. This will not stop other Firebase services.", e);
                }
            } else {
                console.warn("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. App Check will not be enabled.");
            }
        }
    }
}

export { app, auth, db };
