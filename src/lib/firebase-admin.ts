// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import type { AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: admin.app.App | null = null;
let firestoreInstance: admin.firestore.Firestore | null = null;
let storageInstance: admin.storage.Storage | null = null;

const getProjectId = () =>
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const resolveStorageBucket = () =>
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

const isEmulatorEnvironment = () =>
  Boolean(
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.STORAGE_EMULATOR_HOST ||
    process.env.EMULATORS_RUNNING
  );

function initializeAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const options: AppOptions = {};
  const storageBucket = resolveStorageBucket();
  if (storageBucket) {
    options.storageBucket = storageBucket;
  }

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountString) {
    const projectId = getProjectId();

    if (!projectId) {
      throw new Error(
        'Firebase Admin configuration missing. Set FIREBASE_SERVICE_ACCOUNT or NEXT_PUBLIC_FIREBASE_PROJECT_ID.'
      );
    }

    options.projectId = projectId;

    if (!isEmulatorEnvironment()) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT environment variable is not set. Provide credentials or run against the Firebase Emulators.'
      );
    }

    console.warn(
      'FIREBASE_SERVICE_ACCOUNT is not set. Initialising Firebase Admin with emulator-friendly defaults.'
    );

    return admin.initializeApp(options);
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    options.credential = admin.credential.cert(serviceAccount);
    if (!options.projectId) {
      options.projectId = serviceAccount.project_id;
    }
    return admin.initializeApp(options);
  } catch (error) {
    console.error('Failed to initialise Firebase Admin SDK:', error);
    throw new Error('Firebase Admin SDK initialization failed.');
  }
}

function getInitializedApp(): admin.app.App {
  if (!app) {
    app = initializeAdminApp();
  }
  return app;
}

export const getDb = (): admin.firestore.Firestore => {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getInitializedApp());
  }
  return firestoreInstance;
};

export const getAdminStorage = (): admin.storage.Storage => {
  if (!storageInstance) {
    storageInstance = getStorage(getInitializedApp());
  }
  return storageInstance;
};

export const db = getDb();
export const storage = getAdminStorage();

export default admin;
