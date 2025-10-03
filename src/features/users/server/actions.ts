"use server";

import { z } from 'zod';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  getUserProfile,
  updateUserProfile,
  createUserProfile,
  uploadAvatar,
  searchUsers,
  getUsersByIds,
  type UpdateUserProfileInput,
} from './user-service';

// Validation schemas
const updateProfileSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(30).optional(),
  bio: z.string().max(200).optional(),
  avatar: z.string().optional(),
});

const userIdSchema = z.string().min(1);
const searchQuerySchema = z.string().min(1).max(100);

/**
 * Get user profile
 */
export async function getUserProfileAction(userId: string) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

    const profile = await getUserProfile(userId);
    return { success: true, profile };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user profile',
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfileAction(input: UpdateUserProfileInput) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    const validated = updateProfileSchema.parse(input);

    const profile = await updateUserProfile(validated);
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user profile',
    };
  }
}

/**
 * Create user profile
 */
export async function createUserProfileAction(userId: string, email?: string, name?: string) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

    const profile = await createUserProfile(userId, email, name);
    return { success: true, profile };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user profile',
    };
  }
}

/**
 * Upload avatar
 */
export async function uploadAvatarAction(userId: string, base64Image: string) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

    if (!base64Image.startsWith('data:image/')) {
      throw new Error('Invalid image format');
    }

    const avatarUrl = await uploadAvatar(userId, base64Image);
    return { success: true, avatarUrl };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload avatar',
    };
  }
}

/**
 * Search users
 */
export async function searchUsersAction(query: string, limit: number = 20) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    searchQuerySchema.parse(query);

    const users = await searchUsers(query, limit);
    return { success: true, users };
  } catch (error) {
    console.error('Error searching users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search users',
    };
  }
}

/**
 * Get multiple users by IDs
 */
export async function getUsersByIdsAction(userIds: string[]) {
  try {
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    if (!Array.isArray(userIds)) {
      throw new Error('userIds must be an array');
    }

    userIds.forEach(id => userIdSchema.parse(id));

    const users = await getUsersByIds(userIds);
    return { success: true, users };
  } catch (error) {
    console.error('Error getting users by IDs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get users',
    };
  }
}

