#!/usr/bin/env tsx

/**
 * Comprehensive test script for POD.STYLE application
 * Tests all critical Firebase operations and data integrity
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Set GCLOUD_PROJECT from NEXT_PUBLIC_FIREBASE_PROJECT_ID if not set
if (!process.env.GCLOUD_PROJECT && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  process.env.GCLOUD_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

import { getDb } from '../src/lib/firebase-admin';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, passed: true, duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage, duration });
    console.log(`❌ ${name} (${duration}ms)`);
    console.log(`   Error: ${errorMessage}`);
  }
}

async function testFirestoreConnection() {
  const db = getDb();
  const testDoc = await db.collection('_test').doc('connection-test').get();
  // Just checking if we can connect, document doesn't need to exist
  if (db === null) {
    throw new Error('Firestore connection failed');
  }
}

async function testCreationsCollection() {
  const db = getDb();
  const snapshot = await db.collection('creations').limit(1).get();
  if (snapshot.empty) {
    console.warn('   Warning: No creations found in database');
  }
}

async function testCreationsSchema() {
  const db = getDb();
  const snapshot = await db.collection('creations').limit(5).get();
  
  if (snapshot.empty) {
    console.warn('   Warning: No creations to validate schema');
    return;
  }
  
  const requiredFields = [
    'userId',
    'prompt',
    'style',
    'patternUri',
    'models',
    'createdAt',
    'isPublic',
    'orderCount',
    'likeCount',
    'likedBy',
    'favoriteCount',
    'favoritedBy',
    'commentCount',
    'shareCount',
    'remakeCount',
  ];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field '${field}' in creation ${doc.id}`);
      }
    }
  }
}

async function testOrdersCollection() {
  const db = getDb();
  const snapshot = await db.collection('orders').limit(1).get();
  if (snapshot.empty) {
    console.warn('   Warning: No orders found in database');
  }
}

async function testOrdersSchema() {
  const db = getDb();
  const snapshot = await db.collection('orders').limit(5).get();
  
  if (snapshot.empty) {
    console.warn('   Warning: No orders to validate schema');
    return;
  }
  
  const requiredFields = [
    'userId',
    'creationId',
    'category',
    'modelUri',
    'status',
    'createdAt',
  ];
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field '${field}' in order ${doc.id}`);
      }
    }
  }
}

async function testPublicCreationsQuery() {
  const db = getDb();
  const snapshot = await db
    .collection('creations')
    .where('isPublic', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  
  if (snapshot.empty) {
    console.warn('   Warning: No public creations found');
  }
}

async function testFirestoreIndexes() {
  const db = getDb();
  
  // Test public creations index
  await db
    .collection('creations')
    .where('isPublic', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  
  // Test user creations index (using a dummy user ID)
  await db
    .collection('creations')
    .where('userId', '==', 'test-user-id')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  
  // Test user orders index (using a dummy user ID)
  await db
    .collection('orders')
    .where('userId', '==', 'test-user-id')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
}

async function testDataIntegrity() {
  const db = getDb();
  const snapshot = await db.collection('creations').limit(10).get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Check numeric fields are non-negative
    const numericFields = ['orderCount', 'likeCount', 'favoriteCount', 'commentCount', 'shareCount', 'remakeCount'];
    for (const field of numericFields) {
      if (typeof data[field] !== 'number' || data[field] < 0) {
        throw new Error(`Invalid ${field} in creation ${doc.id}: ${data[field]}`);
      }
    }
    
    // Check array fields are arrays
    const arrayFields = ['likedBy', 'favoritedBy', 'models'];
    for (const field of arrayFields) {
      if (!Array.isArray(data[field])) {
        throw new Error(`Invalid ${field} in creation ${doc.id}: not an array`);
      }
    }
    
    // Check boolean fields
    if (typeof data.isPublic !== 'boolean') {
      throw new Error(`Invalid isPublic in creation ${doc.id}: ${data.isPublic}`);
    }
  }
}

async function main() {
  console.log('🧪 Running Comprehensive Tests for POD.STYLE');
  console.log('='.repeat(50));
  console.log('');
  
  console.log('📡 Testing Firebase Connection...');
  await runTest('Firestore Connection', testFirestoreConnection);
  console.log('');
  
  console.log('📚 Testing Collections...');
  await runTest('Creations Collection', testCreationsCollection);
  await runTest('Orders Collection', testOrdersCollection);
  console.log('');
  
  console.log('📋 Testing Data Schema...');
  await runTest('Creations Schema Validation', testCreationsSchema);
  await runTest('Orders Schema Validation', testOrdersSchema);
  console.log('');
  
  console.log('🔍 Testing Queries...');
  await runTest('Public Creations Query', testPublicCreationsQuery);
  console.log('');
  
  console.log('📇 Testing Firestore Indexes...');
  await runTest('Firestore Indexes', testFirestoreIndexes);
  console.log('');
  
  console.log('✅ Testing Data Integrity...');
  await runTest('Data Integrity Checks', testDataIntegrity);
  console.log('');
  
  // Print summary
  console.log('='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log('');
  
  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!');
    process.exit(0);
  }
}

// Run tests
main().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
