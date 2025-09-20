import * as admin from 'firebase-admin';

// Ensure the environment variable is loaded
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error: any) {
        console.error('Firebase Admin initialization error:', error);
        // We can decide if we want to throw the error or handle it gracefully
        throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
    }
}

export const auth = admin.auth();
export const db = admin.firestore();
