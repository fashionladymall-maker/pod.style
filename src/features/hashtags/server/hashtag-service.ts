import { getDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import type { Hashtag, HashtagUsage } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import {
  mockAddHashtagsToCreation,
  mockGetHashtagsForCreation,
  mockGetCreationsByHashtag,
  mockGetTrendingHashtags,
  mockSearchHashtags,
  mockGetHashtagByName,
} from '@/server/mock/mock-store';

const HASHTAGS_COLLECTION = 'hashtags';
const HASHTAG_USAGES_COLLECTION = 'hashtagUsages';

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u4e00-\u9fa5]+/g;
  const matches = text.match(hashtagRegex);
  
  if (!matches) return [];
  
  // Remove # and deduplicate
  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}

/**
 * Get or create hashtag
 */
export async function getOrCreateHashtag(name: string): Promise<Hashtag> {
  const db = getDb();
  const normalizedName = name.toLowerCase();
  
  // Check if hashtag exists
  const snapshot = await db
    .collection(HASHTAGS_COLLECTION)
    .where('name', '==', normalizedName)
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    return snapshot.docs[0].data() as Hashtag;
  }
  
  // Create new hashtag
  const hashtag: Hashtag = {
    id: uuidv4(),
    name: normalizedName,
    count: 0,
    createdAt: new Date().toISOString(),
  };
  
  await db.collection(HASHTAGS_COLLECTION).doc(hashtag.id).set(hashtag);
  
  return hashtag;
}

/**
 * Add hashtags to creation
 */
export async function addHashtagsToCreation(
  creationId: string,
  userId: string,
  text: string
): Promise<string[]> {
  if (!isFirebaseAdminConfigured()) {
    return mockAddHashtagsToCreation(creationId, userId, text);
  }
  const db = getDb();
  const hashtagNames = extractHashtags(text);

  if (hashtagNames.length === 0) return [];
  
  const batch = db.batch();
  const addedHashtags: string[] = [];
  
  for (const name of hashtagNames) {
    const hashtag = await getOrCreateHashtag(name);
    
    // Create usage record
    const usage: HashtagUsage = {
      id: uuidv4(),
      hashtagId: hashtag.id,
      hashtagName: hashtag.name,
      creationId,
      userId,
      createdAt: new Date().toISOString(),
    };
    
    batch.set(
      db.collection(HASHTAG_USAGES_COLLECTION).doc(usage.id),
      usage
    );
    
    // Increment hashtag count
    batch.update(
      db.collection(HASHTAGS_COLLECTION).doc(hashtag.id),
      { count: (hashtag.count || 0) + 1, updatedAt: new Date().toISOString() }
    );
    
    addedHashtags.push(hashtag.name);
  }
  
  await batch.commit();
  
  return addedHashtags;
}

/**
 * Get hashtags for creation
 */
export async function getHashtagsForCreation(creationId: string): Promise<Hashtag[]> {
  if (!isFirebaseAdminConfigured()) {
    return mockGetHashtagsForCreation(creationId);
  }
  const db = getDb();
  
  const usagesSnapshot = await db
    .collection(HASHTAG_USAGES_COLLECTION)
    .where('creationId', '==', creationId)
    .get();
  
  if (usagesSnapshot.empty) return [];
  
  const hashtagIds = usagesSnapshot.docs.map(doc => doc.data().hashtagId);
  
  // Get hashtag details
  const hashtags: Hashtag[] = [];
  for (const id of hashtagIds) {
    const hashtagDoc = await db.collection(HASHTAGS_COLLECTION).doc(id).get();
    if (hashtagDoc.exists) {
      hashtags.push(hashtagDoc.data() as Hashtag);
    }
  }
  
  return hashtags;
}

/**
 * Get creations by hashtag
 */
export async function getCreationsByHashtag(
  hashtagName: string,
  limit: number = 20
): Promise<string[]> {
  if (!isFirebaseAdminConfigured()) {
    return mockGetCreationsByHashtag(hashtagName, limit);
  }
  const db = getDb();
  const normalizedName = hashtagName.toLowerCase();
  
  const snapshot = await db
    .collection(HASHTAG_USAGES_COLLECTION)
    .where('hashtagName', '==', normalizedName)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => doc.data().creationId);
}

/**
 * Get trending hashtags
 */
export async function getTrendingHashtags(limit: number = 20): Promise<Hashtag[]> {
  if (!isFirebaseAdminConfigured()) {
    return mockGetTrendingHashtags(limit);
  }
  const db = getDb();
  
  const snapshot = await db
    .collection(HASHTAGS_COLLECTION)
    .orderBy('count', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Hashtag);
}

/**
 * Search hashtags
 */
export async function searchHashtags(query: string, limit: number = 20): Promise<Hashtag[]> {
  if (!isFirebaseAdminConfigured()) {
    return mockSearchHashtags(query, limit);
  }
  const db = getDb();
  
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase().replace('#', '');
  
  // Simple prefix search
  const snapshot = await db
    .collection(HASHTAGS_COLLECTION)
    .orderBy('name')
    .startAt(normalizedQuery)
    .endAt(normalizedQuery + '\uf8ff')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Hashtag);
}

/**
 * Get hashtag by name
 */
export async function getHashtagByName(name: string): Promise<Hashtag | null> {
  if (!isFirebaseAdminConfigured()) {
    return mockGetHashtagByName(name);
  }
  const db = getDb();
  const normalizedName = name.toLowerCase();
  
  const snapshot = await db
    .collection(HASHTAGS_COLLECTION)
    .where('name', '==', normalizedName)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  
  return snapshot.docs[0].data() as Hashtag;
}

/**
 * Remove hashtags from creation
 */
export async function removeHashtagsFromCreation(creationId: string): Promise<void> {
  const db = getDb();
  
  const snapshot = await db
    .collection(HASHTAG_USAGES_COLLECTION)
    .where('creationId', '==', creationId)
    .get();
  
  if (snapshot.empty) return;
  
  const batch = db.batch();
  
  for (const doc of snapshot.docs) {
    const usage = doc.data() as HashtagUsage;
    
    // Delete usage
    batch.delete(doc.ref);
    
    // Decrement hashtag count
    const hashtagDoc = await db.collection(HASHTAGS_COLLECTION).doc(usage.hashtagId).get();
    if (hashtagDoc.exists) {
      const currentCount = (hashtagDoc.data()?.count || 1);
      batch.update(hashtagDoc.ref, {
        count: Math.max(0, currentCount - 1),
        updatedAt: new Date().toISOString(),
      });
    }
  }
  
  await batch.commit();
}
