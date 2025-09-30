#!/usr/bin/env node

/**
 * Migration script to add missing fields to existing Creation documents
 * This script ensures all Creation documents have the required fields with default values
 */

const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Firebase Admin SDK using the same logic as the app
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const options = {};

  // Get project ID
  const projectId = process.env.GCLOUD_PROJECT ||
                   process.env.GOOGLE_CLOUD_PROJECT ||
                   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (projectId) {
    options.projectId = projectId;
  }

  // Get storage bucket
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ||
                       process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (storageBucket) {
    options.storageBucket = storageBucket;
  }

  // Try to use service account from environment variable
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      options.credential = admin.credential.cert(serviceAccount);
      if (!options.projectId && serviceAccount.project_id) {
        options.projectId = serviceAccount.project_id;
      }
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error.message);
      process.exit(1);
    }
  } else {
    // Try application default credentials
    try {
      options.credential = admin.credential.applicationDefault();
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK. Please set FIREBASE_SERVICE_ACCOUNT or configure application default credentials.');
      process.exit(1);
    }
  }

  if (!options.projectId) {
    console.error('Firebase project ID is not configured. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID or include project_id in credentials.');
    process.exit(1);
  }

  return admin.initializeApp(options);
}

// Initialize Firebase
try {
  initializeFirebaseAdmin();
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.firestore();

const REQUIRED_FIELDS = {
  orderCount: 0,
  likeCount: 0,
  likedBy: [],
  favoriteCount: 0,
  favoritedBy: [],
  commentCount: 0,
  shareCount: 0,
  remakeCount: 0,
};

async function migrateCreationFields() {
  console.log('Starting Creation fields migration...');
  
  try {
    const creationsRef = db.collection('creations');
    const snapshot = await creationsRef.get();
    
    if (snapshot.empty) {
      console.log('No Creation documents found.');
      return;
    }
    
    console.log(`Found ${snapshot.size} Creation documents to check.`);
    
    const batch = db.batch();
    let updatedCount = 0;
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates = {};
      let needsUpdate = false;
      
      // Check each required field
      for (const [field, defaultValue] of Object.entries(REQUIRED_FIELDS)) {
        if (data[field] === undefined || data[field] === null) {
          updates[field] = defaultValue;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        console.log(`Updating document ${doc.id} with missing fields:`, Object.keys(updates));
        batch.update(doc.ref, updates);
        updatedCount++;
        batchCount++;
        
        // Commit batch every 500 operations to avoid limits
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`Migration completed. Updated ${updatedCount} documents.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function migrateOrderFields() {
  console.log('Starting Order fields migration...');
  
  try {
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.get();
    
    if (snapshot.empty) {
      console.log('No Order documents found.');
      return;
    }
    
    console.log(`Found ${snapshot.size} Order documents to check.`);
    
    const batch = db.batch();
    let updatedCount = 0;
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates = {};
      let needsUpdate = false;
      
      // Ensure statusHistory exists
      if (!data.statusHistory || !Array.isArray(data.statusHistory)) {
        updates.statusHistory = data.statusHistory || [];
        needsUpdate = true;
      }
      
      // Ensure status exists
      if (!data.status) {
        updates.status = 'Processing';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`Updating order document ${doc.id} with missing fields:`, Object.keys(updates));
        batch.update(doc.ref, updates);
        updatedCount++;
        batchCount++;
        
        // Commit batch every 500 operations to avoid limits
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`Order migration completed. Updated ${updatedCount} documents.`);
    
  } catch (error) {
    console.error('Order migration failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await migrateCreationFields();
    await migrateOrderFields();
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration script failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { migrateCreationFields, migrateOrderFields };
