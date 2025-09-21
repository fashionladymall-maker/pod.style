// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: admin.app.App;

function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('FIREBASE_SERVICE_ACCOUNT is not set. Server-side Firebase features will not work.');
            // Return a dummy app object to prevent crashes in dev without config
            return {
                firestore: () => { throw new Error("Firebase Admin not initialized.") },
                storage: () => { throw new Error("Firebase Admin not initialized.") },
            } as any;
        }
        throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }

    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
        throw new Error('FIREBASE_STORAGE_BUCKET environment variable is not set.');
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountString);
        const newApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: storageBucket,
        });
        console.log('Firebase Admin SDK initialized successfully.');
        return newApp;
    } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT or initialize Firebase Admin SDK:', e);
        throw new Error('Firebase Admin SDK initialization failed.');
    }
}

function getInitializedApp() {
    if (!app) {
        app = initializeAdminApp();
    }
    return app;
}

// Lazy-initialized services
const db: admin.firestore.Firestore = getFirestore(getInitializedApp());
const storage: admin.storage.Storage = getStorage(getInitializedApp());

export { db, storage };
export default admin;
