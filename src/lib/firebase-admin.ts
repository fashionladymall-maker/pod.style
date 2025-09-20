
import * as admin from 'firebase-admin';

// This is the final attempt to simplify the initialization.
// The root cause of the error "FIREBASE_SERVICE_ACCOUNT is not set" is an
// environment configuration issue, NOT a code issue.
// The user MUST create a .env.local file in the project root and add the
// FIREBASE_SERVICE_ACCOUNT variable.

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    // This error is intentional and correct. The environment is missing the required variable.
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set. Please create a .env.local file in the root of your project and add the service account JSON to it.');
}

try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} catch (error: any) {
    console.error('Firebase Admin initialization error: Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it is a valid, single-line JSON.', error.stack);
    throw new Error('Failed to initialize Firebase Admin SDK. The FIREBASE_SERVICE_ACCOUNT environment variable might be a malformed JSON.');
}

const db = admin.firestore();

export function getDb() {
  return db;
}
