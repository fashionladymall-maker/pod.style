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

const hasServiceAccountCredentials = () => Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);

const hasApplicationDefaultCredentials = () => Boolean(
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.GOOGLE_AUTH_CREDENTIALS ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
);

const isEmulatorEnvironment = () =>
  Boolean(
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.STORAGE_EMULATOR_HOST ||
    process.env.EMULATORS_RUNNING
  );

export const isFirebaseAdminConfigured = () => {
  if (isEmulatorEnvironment()) {
    return true;
  }

  if (hasServiceAccountCredentials()) {
    return true;
  }

  if (hasApplicationDefaultCredentials()) {
    return true;
  }

  // Having only a project id without credentials is not enough to talk to Firebase Admin SDK.
  // Treat this as unconfigured so that the application can fall back to mock services.
  return false;
};

function initializeAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const options: AppOptions = {};
  const storageBucket = resolveStorageBucket();
  if (storageBucket) {
    options.storageBucket = storageBucket;
  }

  const projectId = getProjectId();
  if (projectId) {
    options.projectId = projectId;
  }

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  const runningOnEmulator = isEmulatorEnvironment();

  if (serviceAccountString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      options.credential = admin.credential.cert(serviceAccount);
      if (!options.projectId && serviceAccount.project_id) {
        options.projectId = serviceAccount.project_id;
      }
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Ensure it contains valid JSON.', error);
      throw new Error('Firebase Admin SDK initialization failed due to invalid FIREBASE_SERVICE_ACCOUNT.');
    }
  } else {
    try {
      options.credential = admin.credential.applicationDefault();
    } catch (error) {
      if (runningOnEmulator) {
        console.warn(
          'FIREBASE_SERVICE_ACCOUNT is not set. Initialising Firebase Admin with emulator-friendly defaults.'
        );
      } else {
        console.error('Failed to load application default credentials for Firebase Admin SDK.', error);
        throw new Error(
          'Firebase Admin SDK initialization failed. Provide FIREBASE_SERVICE_ACCOUNT or configure application default credentials.'
        );
      }
    }
  }

  if (!options.projectId) {
    if (runningOnEmulator) {
      console.warn('Firebase project ID not set. Using emulator defaults.');
    } else if (!options.credential) {
      throw new Error(
        'Firebase Admin project ID is not configured. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID or include project_id in credentials.'
      );
    }
  }

  return admin.initializeApp(options);
}

function getInitializedApp(): admin.app.App {
  if (!app) {
    app = initializeAdminApp();
  }
  return app;
}

export const getDb = (): admin.firestore.Firestore => {
  if (!firestoreInstance) {
    const app = getInitializedApp();
    firestoreInstance = getFirestore(app);

    // Configure Firestore settings before first use
    try {
      firestoreInstance.settings({
        ignoreUndefinedProperties: true,
        preferRest: false,
      });
    } catch (error) {
      // Settings already configured, ignore error
      console.warn('Firestore settings already configured:', error);
    }
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
