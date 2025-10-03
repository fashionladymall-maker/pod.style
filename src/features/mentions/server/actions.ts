"use server";

import { z } from 'zod';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  extractMentions,
  createMentionsFromText,
  getMentionsForUser,
  getMentionsInComment,
  searchUsersForMention,
} from './mention-service';

// Validation schemas
const textSchema = z.string().min(1);
const userIdSchema = z.string().min(1);
const commentIdSchema = z.string().min(1);

/**
 * Extract mentions from text
 */
export async function extractMentionsAction(text: string) {
  try {
    textSchema.parse(text);
    const mentions = extractMentions(text);
    return { success: true, mentions };
  } catch (error) {
    console.error('Error extracting mentions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract mentions',
    };
  }
}

/**
 * Create mentions from text
 */
export async function createMentionsFromTextAction(
  text: string,
  mentionerUserId: string,
  creationId?: string,
  commentId?: string
) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    textSchema.parse(text);
    userIdSchema.parse(mentionerUserId);

    const mentions = await createMentionsFromText(
      text,
      mentionerUserId,
      creationId,
      commentId
    );
    
    return { success: true, mentions };
  } catch (error) {
    console.error('Error creating mentions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create mentions',
    };
  }
}

/**
 * Get mentions for a user
 */
export async function getMentionsForUserAction(userId: string, limit: number = 20) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

    const mentions = await getMentionsForUser(userId, limit);
    return { success: true, mentions };
  } catch (error) {
    console.error('Error getting mentions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mentions',
    };
  }
}

/**
 * Get mentions in a comment
 */
export async function getMentionsInCommentAction(commentId: string) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    commentIdSchema.parse(commentId);

    const mentions = await getMentionsInComment(commentId);
    return { success: true, mentions };
  } catch (error) {
    console.error('Error getting mentions in comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mentions',
    };
  }
}

/**
 * Search users for mention suggestions
 */
export async function searchUsersForMentionAction(query: string, limit: number = 5) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    textSchema.parse(query);

    const users = await searchUsersForMention(query, limit);
    return { success: true, users };
  } catch (error) {
    console.error('Error searching users for mention:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search users',
    };
  }
}

