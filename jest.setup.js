// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://jestjs.io/docs/configuration#setupfilesafterenv-array

// Mock Firebase Admin SDK for tests
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  apps: [],
  app: jest.fn(),
  credential: {
    cert: jest.fn(),
    applicationDefault: jest.fn(),
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
  })),
}));

// Firebase Admin lib will be mocked in individual test files as needed

// Mock Next.js headers and cookies
jest.mock('next/headers', () => ({
  headers: jest.fn(() => Promise.resolve({
    get: jest.fn(),
  })),
  cookies: jest.fn(() => Promise.resolve({
    get: jest.fn(),
  })),
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_SERVICE_ACCOUNT = '{"type":"service_account","project_id":"test-project"}';
process.env.FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
