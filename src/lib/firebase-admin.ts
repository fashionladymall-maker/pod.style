
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let app: App;
let db: Firestore;
let storage: Storage;

// This function is used to load the service account credentials from environment variables.
// It supports three ways of providing the credentials:
// 1. A base64 encoded string of the service account JSON file.
// 2. The path to the service account JSON file.
// 3. The individual components of the service account (project_id, client_email, private_key).
function loadServiceAccount() {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountEnv) {
    try {
      const decodedServiceAccount =
        /^[A-Za-z0-9+/=]+$/.test(serviceAccountEnv) && !serviceAccountEnv.trim().startsWith('{')
          ? Buffer.from(serviceAccountEnv, 'base64').toString('utf8')
          : serviceAccountEnv;
      
      const parsed = JSON.parse(decodedServiceAccount);
      
      // The private_key in the environment variable might have its newlines escaped.
      // This is a common issue when storing multi-line strings in environment variables.
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }

      return parsed;
    } catch (e: any) {
      console.error(
        'Failed to parse FIREBASE_SERVICE_ACCOUNT. Please ensure it is a valid JSON string or a base64 encoded JSON.',
        e.message
      );
      throw new Error('Failed to initialize Firebase Admin SDK: Malformed FIREBASE_SERVICE_ACCOUNT.');
    }
  }

  // If the service account is not provided as a single environment variable,
  // we try to load it from the individual components.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
     if (privateKey) {
        // The private_key in the environment variable might have its newlines escaped.
        privateKey = privateKey.replace(/\\n/g, '\n');
     }
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  // If the credentials are not provided in any of the supported ways, we throw an error.
  throw new Error(
    'Firebase Admin credentials are not set. Please set FIREBASE_SERVICE_ACCOUNT or the individual FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
  );
}


// We only initialize the app if it hasn't been initialized yet.
// This is to prevent the "Firebase app named "[DEFAULT]" already exists" error.
if (!getApps().length) {
  try {
    const serviceAccount = loadServiceAccount();
    const projectId = serviceAccount.project_id;
    app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: `${projectId}.appspot.com`,
    });
  } catch (error: any) {
     throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
  }
} else {
    app = getApp();
}

db = getFirestore(app);
storage = getStorage(app);

export { db, storage };
