import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  "projectId": "studio-1269295870-5fde0",
  "appId": "1:204491544475:web:dadc0d6d650572156db33e",
  "apiKey": "AIzaSyAr_uiyZThmAYRDigXt0g_0Y2am2ojc8I0",
  "authDomain": "studio-1269295870-5fde0.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "204491544475",
  "storageBucket": "studio-1269295870-5fde0.appspot.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize App Check
if (typeof window !== 'undefined') {
  // IMPORTANT: DO NOT COMMIT THIS TO VERSION CONTROL WITH TRUE IN A PRODUCTION APP
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NODE_ENV !== 'production';

  // Pass your reCAPTCHA v3 site key (public key) to activate.
  // This key is safe to expose publicly.
  const reCaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (reCaptchaKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(reCaptchaKey),
        isTokenAutoRefreshEnabled: true
      });
  }
}


const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
