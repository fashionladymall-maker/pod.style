import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "studio-1269295870-5fde0",
  "appId": "1:204491544475:web:dadc0d6d650572156db33e",
  "apiKey": "AIzaSyAr_uiyZThmAYRDigXt0g_0Y2am2ojc8I0",
  "authDomain": "studio-1269295870-5fde0.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "204491544475"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
