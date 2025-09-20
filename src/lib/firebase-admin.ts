// src/lib/firebase-admin.ts

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// 1. 讀取並解析 Service Account
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountString) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set or empty.');
}
const serviceAccount = JSON.parse(serviceAccountString);

// 2. 讀取 Storage Bucket 名稱
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
if (!storageBucket) {
  throw new Error('FIREBASE_STORAGE_BUCKET environment variable is not set or empty.');
}

// 3. 初始化 Firebase Admin SDK
// 透過檢查 admin.apps.length 避免在開發環境中重複初始化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: storageBucket,
  });
  console.log('Firebase Admin SDK initialized successfully.');
}

// 4. 匯出需要的服務，方便在其他地方使用
export const db = getFirestore();
export const storage = getStorage();

// 匯出 admin 本身，以備不時之需
export default admin;
