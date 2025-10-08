"use server";

import { getDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import type { ViewHistory } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import {
  mockRecordView,
  mockGetViewHistory,
  mockGetViewedCreationIds,
  mockClearViewHistory,
  mockDeleteViewHistoryItem,
  mockHasViewed,
  mockGetRecentlyViewed,
  mockGetAllViewHistoryEntries,
} from '@/server/mock/mock-store';

const VIEW_HISTORY_COLLECTION = 'viewHistory';

/**
 * Record a view
 */
export async function recordView(
  userId: string,
  creationId: string,
  duration?: number
): Promise<ViewHistory> {
  if (!isFirebaseAdminConfigured()) {
    return mockRecordView(userId, creationId, duration);
  }
  const db = getDb();
  
  // Check if already viewed recently (within last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentView = await db
    .collection(VIEW_HISTORY_COLLECTION)
    .where('userId', '==', userId)
    .where('creationId', '==', creationId)
    .where('viewedAt', '>', oneHourAgo)
    .limit(1)
    .get();
  
  if (!recentView.empty) {
    // Update existing view
    const existingView = recentView.docs[0];
    const updatedView: ViewHistory = {
      ...existingView.data() as ViewHistory,
      viewedAt: new Date().toISOString(),
      duration: duration || existingView.data().duration,
    };
    
    await db.collection(VIEW_HISTORY_COLLECTION).doc(existingView.id).update({
      viewedAt: updatedView.viewedAt,
      duration: updatedView.duration,
    });
    
    return updatedView;
  }
  
  // Create new view record
  const viewHistory: ViewHistory = {
    id: uuidv4(),
    userId,
    creationId,
    viewedAt: new Date().toISOString(),
    duration,
  };
  
  await db.collection(VIEW_HISTORY_COLLECTION).doc(viewHistory.id).set(viewHistory);
  
  return viewHistory;
}

/**
 * Get view history for a user
 */
export async function getViewHistory(
  userId: string,
  limit: number = 50
): Promise<ViewHistory[]> {
  if (!isFirebaseAdminConfigured()) {
    return mockGetViewHistory(userId, limit);
  }
  const db = getDb();
  
  const snapshot = await db
    .collection(VIEW_HISTORY_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('viewedAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => doc.data() as ViewHistory);
}

/**
 * Get unique creation IDs from view history
 */
export async function getViewedCreationIds(
  userId: string,
  limit: number = 50
): Promise<string[]> {
  if (!isFirebaseAdminConfigured()) {
    return mockGetViewedCreationIds(userId, limit);
  }
  const history = await getViewHistory(userId, limit);
  
  // Remove duplicates and return creation IDs
  const creationIds = [...new Set(history.map(h => h.creationId))];
  
  return creationIds.slice(0, limit);
}

/**
 * Clear view history for a user
 */
export async function clearViewHistory(userId: string): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    mockClearViewHistory(userId);
    return;
  }
  const db = getDb();
  
  const snapshot = await db
    .collection(VIEW_HISTORY_COLLECTION)
    .where('userId', '==', userId)
    .get();
  
  if (snapshot.empty) return;
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

/**
 * Delete a specific view history item
 */
export async function deleteViewHistoryItem(historyId: string): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    mockDeleteViewHistoryItem(historyId);
    return;
  }
  const db = getDb();
  
  await db.collection(VIEW_HISTORY_COLLECTION).doc(historyId).delete();
}

/**
 * Check if user has viewed a creation
 */
export async function hasViewed(userId: string, creationId: string): Promise<boolean> {
  if (!isFirebaseAdminConfigured()) {
    return mockHasViewed(userId, creationId);
  }
  const db = getDb();
  
  const snapshot = await db
    .collection(VIEW_HISTORY_COLLECTION)
    .where('userId', '==', userId)
    .where('creationId', '==', creationId)
    .limit(1)
    .get();
  
  return !snapshot.empty;
}

/**
 * Get view count for a creation
 */
export async function getViewCount(creationId: string): Promise<number> {
  if (!isFirebaseAdminConfigured()) {
    return mockGetAllViewHistoryEntries().filter((entry) => entry.creationId === creationId).length;
  }
  const db = getDb();
  
  const snapshot = await db
    .collection(VIEW_HISTORY_COLLECTION)
    .where('creationId', '==', creationId)
    .get();
  
  return snapshot.size;
}

/**
 * Get total view time for a creation
 */
export async function getTotalViewTime(creationId: string): Promise<number> {
  if (!isFirebaseAdminConfigured()) {
    return mockGetAllViewHistoryEntries()
      .filter((entry) => entry.creationId === creationId)
      .reduce((total, entry) => total + (entry.duration ?? 0), 0);
  }
  const db = getDb();
  
  const snapshot = await db
    .collection(VIEW_HISTORY_COLLECTION)
    .where('creationId', '==', creationId)
    .get();
  
  let totalTime = 0;
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    totalTime += data.duration || 0;
  });
  
  return totalTime;
}

/**
 * Get recently viewed creations (last 24 hours)
 */
export async function getRecentlyViewed(
  userId: string,
  limit: number = 20
): Promise<string[]> {
  if (!isFirebaseAdminConfigured()) {
    return mockGetRecentlyViewed(userId, limit);
  }
  const db = getDb();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const snapshot = await db
    .collection(VIEW_HISTORY_COLLECTION)
    .where('userId', '==', userId)
    .where('viewedAt', '>', oneDayAgo)
    .orderBy('viewedAt', 'desc')
    .limit(limit)
    .get();
  
  const creationIds = [...new Set(snapshot.docs.map(doc => doc.data().creationId))];
  
  return creationIds;
}
