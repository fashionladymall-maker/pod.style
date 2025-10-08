"use server";

import { z } from 'zod';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  extractHashtags,
  addHashtagsToCreation,
  getHashtagsForCreation,
  getCreationsByHashtag,
  getTrendingHashtags,
  searchHashtags,
  getHashtagByName,
} from './hashtag-service';

// Validation schemas
const textSchema = z.string().min(1);
const hashtagNameSchema = z.string().min(1).max(50);
const creationIdSchema = z.string().min(1);

const shouldRequireFirestore = () =>
  !isFirebaseAdminConfigured() && process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCK_SERVICES !== 'true';

/**
 * Extract hashtags from text
 */
export async function extractHashtagsAction(text: string) {
  try {
    textSchema.parse(text);
    const hashtags = extractHashtags(text);
    return { success: true, hashtags };
  } catch (error) {
    console.error('Error extracting hashtags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract hashtags',
    };
  }
}

/**
 * Add hashtags to creation
 */
export async function addHashtagsToCreationAction(
  creationId: string,
  userId: string,
  text: string
) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    creationIdSchema.parse(creationId);
    z.string().min(1).parse(userId);
    textSchema.parse(text);
    const hashtags = await addHashtagsToCreation(creationId, userId, text);
    return { success: true, hashtags };
  } catch (error) {
    console.error('Error adding hashtags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add hashtags',
    };
  }
}

/**
 * Get hashtags for creation
 */
export async function getHashtagsForCreationAction(creationId: string) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    creationIdSchema.parse(creationId);

    const hashtags = await getHashtagsForCreation(creationId);
    return { success: true, hashtags };
  } catch (error) {
    console.error('Error getting hashtags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get hashtags',
    };
  }
}

/**
 * Get creations by hashtag
 */
export async function getCreationsByHashtagAction(hashtagName: string, limit: number = 20) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    hashtagNameSchema.parse(hashtagName);

    const creationIds = await getCreationsByHashtag(hashtagName, limit);
    return { success: true, creationIds };
  } catch (error) {
    console.error('Error getting creations by hashtag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get creations',
    };
  }
}

/**
 * Get trending hashtags
 */
export async function getTrendingHashtagsAction(limit: number = 20) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    const hashtags = await getTrendingHashtags(limit);
    return { success: true, hashtags };
  } catch (error) {
    console.error('Error getting trending hashtags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get trending hashtags',
    };
  }
}

/**
 * Search hashtags
 */
export async function searchHashtagsAction(query: string, limit: number = 20) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    textSchema.parse(query);

    const hashtags = await searchHashtags(query, limit);
    return { success: true, hashtags };
  } catch (error) {
    console.error('Error searching hashtags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search hashtags',
    };
  }
}

/**
 * Get hashtag by name
 */
export async function getHashtagByNameAction(name: string) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    hashtagNameSchema.parse(name);

    const hashtag = await getHashtagByName(name);
    return { success: true, hashtag };
  } catch (error) {
    console.error('Error getting hashtag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get hashtag',
    };
  }
}
