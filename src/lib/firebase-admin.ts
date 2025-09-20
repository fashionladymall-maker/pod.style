import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// Explicitly load environment variables from .env file
config();

// This is the recommended way to initialize firebase-admin in a serverless environment
// as of Next.js 15 / App Router. We check if the app is already initialized to
// prevent re-initialization on hot reloads.

if (!admin.apps.length) {
    try {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
        }
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error: any) {
        console.error('Firebase Admin initialization error', error.stack);
        // We throw the error to prevent the app from starting with a misconfigured Firebase connection.
        throw new Error('Failed to initialize Firebase Admin SDK. Please check your FIREBASE_SERVICE_ACCOUNT environment variable.');
    }
}


export const db = admin.firestore();
export const auth = admin.auth();
