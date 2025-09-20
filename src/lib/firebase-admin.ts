
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function loadServiceAccount() {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountEnv) {
    try {
      const decodedServiceAccount =
        /^[A-Za-z0-9+/=]+$/.test(serviceAccountEnv) && !serviceAccountEnv.trim().startsWith('{')
          ? Buffer.from(serviceAccountEnv, 'base64').toString('utf8')
          : serviceAccountEnv;
      
      const parsed = JSON.parse(decodedServiceAccount);
      
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

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
     if (privateKey) {
        privateKey = privateKey.replace(/\\n/g, '\n');
     }
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  throw new Error(
    'Firebase Admin credentials are not set. Please set FIREBASE_SERVICE_ACCOUNT or the individual FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
  );
}

if (!getApps().length) {
  try {
    const serviceAccount = loadServiceAccount();
    const projectId = serviceAccount.project_id;
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: `${projectId}.appspot.com`,
    });
  } catch (error: any) {
     throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
  }
}

export const db = getFirestore();
export const storage = getStorage();
