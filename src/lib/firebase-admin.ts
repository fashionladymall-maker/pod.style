
import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore;

function initializeDb() {
  // This check is to prevent the app from crashing in environments where the environment variable is not set.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
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
      console.error('Firebase Admin initialization error', error.stack);
      // We throw the error to prevent the app from starting with a misconfigured Firebase connection.
      throw new Error('Failed to initialize Firebase Admin SDK. The FIREBASE_SERVICE_ACCOUNT environment variable might be a malformed JSON.');
  }
  
  return admin.firestore();
}

export function getDb() {
  if (!db) {
    db = initializeDb();
  }
  return db;
}

// We are not exporting authAdmin for now as it's not used.
// export const authAdmin = admin.auth();
