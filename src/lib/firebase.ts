
import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  getAuth,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

interface AppCheckDebugWindow extends Window {
  FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean;
}

type MaybeFirebaseConfig = Partial<FirebaseOptions> | null | undefined;

const parseJson = <T>(value: string | undefined): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to parse JSON environment variable", error);
    }
    return null;
  }
};

const getFirebaseConfigFromDefaults = (): MaybeFirebaseConfig => {
  const defaults = parseJson<Record<string, unknown>>(process.env["__FIREBASE_DEFAULTS__"]);
  if (!defaults) {
    return null;
  }

  if (typeof defaults.config === "object" && defaults.config !== null) {
    return defaults.config as Partial<FirebaseOptions>;
  }

  if (typeof defaults.firebaseConfig === "object" && defaults.firebaseConfig !== null) {
    return defaults.firebaseConfig as Partial<FirebaseOptions>;
  }

  const possibleConfig = defaults as Partial<FirebaseOptions>;
  if (possibleConfig.apiKey || possibleConfig.projectId) {
    return possibleConfig;
  }

  return null;
};

const getFirebaseConfigFromFirebaseConfigEnv = (): MaybeFirebaseConfig => {
  const config = parseJson<Partial<FirebaseOptions>>(process.env.FIREBASE_CONFIG);
  if (config && (config.apiKey || config.projectId)) {
    return config;
  }
  return null;
};

const firebaseDefaultsConfig = getFirebaseConfigFromDefaults();
const firebaseConfigEnv = getFirebaseConfigFromFirebaseConfigEnv();

const firebaseConfig: Partial<FirebaseOptions> = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    process.env.FIREBASE_API_KEY ??
    firebaseDefaultsConfig?.apiKey ??
    firebaseConfigEnv?.apiKey,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    process.env.FIREBASE_AUTH_DOMAIN ??
    firebaseDefaultsConfig?.authDomain ??
    firebaseConfigEnv?.authDomain,
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    process.env.FIREBASE_PROJECT_ID ??
    firebaseDefaultsConfig?.projectId ??
    firebaseConfigEnv?.projectId,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    process.env.FIREBASE_STORAGE_BUCKET ??
    firebaseDefaultsConfig?.storageBucket ??
    firebaseConfigEnv?.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    process.env.FIREBASE_MESSAGING_SENDER_ID ??
    firebaseDefaultsConfig?.messagingSenderId ??
    firebaseConfigEnv?.messagingSenderId,
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    process.env.FIREBASE_APP_ID ??
    firebaseDefaultsConfig?.appId ??
    firebaseConfigEnv?.appId,
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ??
    process.env.FIREBASE_MEASUREMENT_ID ??
    firebaseDefaultsConfig?.measurementId ??
    firebaseConfigEnv?.measurementId,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const ensureFirebaseApp = (): FirebaseApp | null => {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Firebase configuration is incomplete. Firebase services will be disabled. Please ensure your Firebase web app configuration is available via NEXT_PUBLIC_FIREBASE_* env vars or the Firebase Studio environment defaults.",
      );
    }
    return null;
  }

  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
  }

  return app;
};

const initialiseAuthForBrowser = (firebaseApp: FirebaseApp): Auth => {
  try {
    return initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, inMemoryPersistence],
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Firebase Auth was already initialised. Falling back to getAuth().",
        error,
      );
    }
    // If Auth has already been initialised (for example by Fast Refresh), fall back to getAuth.
    return getAuth(firebaseApp);
  }
};

export const getFirebaseAuth = (): Auth | null => {
  const firebaseApp = ensureFirebaseApp();
  if (!firebaseApp || typeof window === "undefined") {
    return null;
  }

  if (!auth) {
    auth = initialiseAuthForBrowser(firebaseApp);
  }

  return auth;
};

const firebaseApp = ensureFirebaseApp();

if (firebaseApp) {
  db = getFirestore(firebaseApp);

  if (typeof window !== "undefined") {
    auth = getFirebaseAuth();

    // Initialize App Check and handle errors gracefully
    if (process.env.NODE_ENV === "development") {
      (window as AppCheckDebugWindow).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    const reCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (reCaptchaKey) {
      try {
        initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaV3Provider(reCaptchaKey),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("Firebase App Check initialized successfully.");
      } catch (e) {
        console.error(
          "Failed to initialize Firebase App Check. This will not stop other Firebase services.",
          e,
        );
      }
    } else {
      console.warn("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. App Check will not be enabled.");
    }
  }
}

export { firebaseApp as app, auth, db };
