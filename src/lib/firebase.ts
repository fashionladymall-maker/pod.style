import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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
// if (typeof window !== 'undefined') {
//   // Set to true to get a debug token in the console.
//   // This can be used to test App Check without a real reCAPTCHA provider.
//   // Make sure to remove this in production.
//   (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;

//   initializeAppCheck(app, {
//     provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
//     isTokenAutoRefreshEnabled: true
//   });
// }


const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
