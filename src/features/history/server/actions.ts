"use server";

import { z } from 'zod';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  recordView,
  getViewHistory,
  getViewedCreationIds,
  clearViewHistory,
  deleteViewHistoryItem,
  hasViewed,
  getRecentlyViewed,
} from './history-service';

// Validation schemas
const userIdSchema = z.string().min(1);
const creationIdSchema = z.string().min(1);
const historyIdSchema = z.string().min(1);

/**
 * Record a view
 */
export async function recordViewAction(
  userId: string,
  creationId: string,
  duration?: number
) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);
    creationIdSchema.parse(creationId);

    const viewHistory = await recordView(userId, creationId, duration);
    return { success: true, viewHistory };
  } catch (error) {
    console.error('Error recording view:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record view',
    };
  }
}

/**
 * Get view history
 */
export async function getViewHistoryAction(userId: string, limit: number = 50) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

    const history = await getViewHistory(userId, limit);
    return { success: true, history };
  } catch (error) {
    console.error('Error getting view history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get view history',
    };
  }
}

/**
 * Get viewed creation IDs
 */
export async function getViewedCreationIdsAction(userId: string, limit: number = 50) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

    const creationIds = await getViewedCreationIds(userId, limit);
    return { success: true, creationIds };
  } catch (error) {
    console.error('Error getting viewed creation IDs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get viewed creations',
    };
  }
}

/**
 * Clear view history
 */
export async function clearViewHistoryAction(userId: string) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

    await clearViewHistory(userId);
    return { success: true };
  } catch (error) {
    console.error('Error clearing view history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear view history',
    };
  }
}

/**
 * Delete view history item
 */
export async function deleteViewHistoryItemAction(historyId: string) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    historyIdSchema.parse(historyId);

    await deleteViewHistoryItem(historyId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting view history item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete view history item',
    };
  }
}

/**
 * Check if user has viewed a creation
 */
export async function hasViewedAction(userId: string, creationId: string) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);
    creationIdSchema.parse(creationId);

    const viewed = await hasViewed(userId, creationId);
    return { success: true, viewed };
  } catch (error) {
    console.error('Error checking if viewed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check if viewed',
    };
  }
}

/**
 * Get recently viewed creations
 */
export async function getRecentlyViewedAction(userId: string, limit: number = 20) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

    const creationIds = await getRecentlyViewed(userId, limit);
    return { success: true, creationIds };
  } catch (error) {
    console.error('Error getting recently viewed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recently viewed',
    };
  }
}

