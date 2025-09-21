// src/lib/firebase-admin.ts

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// 1. 讀取並解析 Service Account
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountString) {
  // 在開發環境中，如果沒有設定環境變數，我們提供一個更友好的提示
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT environment variable is not set. Server-side Firebase features will not work.'
    );
  } else {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT environment variable is not set or empty.'
    );
  }
}

// 2. 讀取 Storage Bucket 名稱
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
if (!storageBucket && serviceAccountString) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'FIREBASE_STORAGE_BUCKET environment variable is not set. Firebase Storage features might not work as expected.'
    );
  } else {
    throw new Error(
      'FIREBASE_STORAGE_BUCKET environment variable is not set or empty.'
    );
  }
}

// 3. 初始化 Firebase Admin SDK
// 透過檢查 admin.apps.length 避免在開發環境中重複初始化
if (!admin.apps.length && serviceAccountString) {
  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: storageBucket,
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT or initialize Firebase Admin SDK:', e);
  }
}

// 4. 匯出需要的服務，方便在其他地方使用
// 只有在SDK成功初始化後才嘗試獲取服務
let db: admin.firestore.Firestore;
let storage: admin.storage.Storage;

if (admin.apps.length > 0) {
  db = getFirestore();
  storage = getStorage();
} else {
  // 提供一個假的db和storage對象，以避免在開發環境中沒有配置時應用崩潰
  // @ts-ignore
  db = {
    collection: () => ({
      doc: () => ({ get: async () => ({ exists: false }) }),
      where: () => ({ get: async () => ({ empty: true, docs: [] }) }),
      add: async () => ({ get: async () => ({}) }),
    }),
  } as admin.firestore.Firestore;
  // @ts-ignore
  storage = {
    bucket: () => ({
      file: () => ({
        save: async () => {},
        makePublic: async () => {},
        publicUrl: () => '',
        delete: async () => {},
      }),
    }),
  } as admin.storage.Storage;
}


export { db, storage };

// 匯出 admin 本身，以備不時之需
export default admin;
