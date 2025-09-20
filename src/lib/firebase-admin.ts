
import * as admin from 'firebase-admin';

// ❗️ 加入这行来侦错 ❗️
console.log("Reading FIREBASE_SERVICE_ACCOUNT:", process.env.FIREBASE_SERVICE_ACCOUNT);

// This check is to prevent the app from crashing in environments where the environment variable is not set.
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
}

try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    
    // Initialize the app only if it's not already initialized
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} catch (error: any) {
    console.error('Firebase Admin initialization error', error.stack);
    // We throw the error to prevent the app from starting with a misconfigured Firebase connection.
    throw new Error('Failed to initialize Firebase Admin SDK. Please check your FIREBASE_SERVICE_ACCOUNT environment variable.');
}


export const db = admin.firestore();
export const authAdmin = admin.auth();
