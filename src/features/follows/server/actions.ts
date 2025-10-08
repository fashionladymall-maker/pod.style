"use server";

import { z } from 'zod';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowStats,
  getFollowing,
  getFollowers,
  getMutualFollows,
  removeFollower,
} from './follow-service';
import type { FollowInput } from '@/lib/types';

// Validation schemas
const followInputSchema = z.object({
  followerId: z.string().min(1),
  followingId: z.string().min(1),
});

const userIdSchema = z.string().min(1);

const shouldRequireFirestore = () =>
  !isFirebaseAdminConfigured() && process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCK_SERVICES !== 'true';

/**
 * Follow a user
 */
export async function followUserAction(input: FollowInput) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    const validated = followInputSchema.parse(input);
    
    // Prevent self-follow
    if (validated.followerId === validated.followingId) {
      throw new Error('Cannot follow yourself');
    }

    const follow = await followUser(validated);
    return { success: true, follow };
  } catch (error) {
    console.error('Error following user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to follow user',
    };
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUserAction(input: FollowInput) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    const validated = followInputSchema.parse(input);
    
    await unfollowUser(validated);
    return { success: true };
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unfollow user',
    };
  }
}

/**
 * Toggle follow status
 */
export async function toggleFollowAction(input: FollowInput) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    const validated = followInputSchema.parse(input);
    
    // Prevent self-follow
    if (validated.followerId === validated.followingId) {
      throw new Error('Cannot follow yourself');
    }

    const following = await isFollowing(validated.followerId, validated.followingId);
    
    if (following) {
      await unfollowUser(validated);
      return { success: true, isFollowing: false };
    } else {
      await followUser(validated);
      return { success: true, isFollowing: true };
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle follow',
    };
  }
}

/**
 * Check if following
 */
export async function isFollowingAction(followerId: string, followingId: string) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(followerId);
    userIdSchema.parse(followingId);

    const following = await isFollowing(followerId, followingId);
    return { success: true, isFollowing: following };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check follow status',
    };
  }
}

/**
 * Get follow stats
 */
export async function getFollowStatsAction(userId: string, currentUserId?: string) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);
    if (currentUserId) {
      userIdSchema.parse(currentUserId);
    }

    const stats = await getFollowStats(userId, currentUserId);
    return { success: true, stats };
  } catch (error) {
    console.error('Error getting follow stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get follow stats',
    };
  }
}

/**
 * Get following list
 */
export async function getFollowingAction(userId: string, page: number = 1) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

    const result = await getFollowing(userId, page);
    return { success: true, ...result };
  } catch (error) {
    console.error('Error getting following list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get following list',
    };
  }
}

/**
 * Get followers list
 */
export async function getFollowersAction(userId: string, page: number = 1) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

    const result = await getFollowers(userId, page);
    return { success: true, ...result };
  } catch (error) {
    console.error('Error getting followers list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get followers list',
    };
  }
}

/**
 * Get mutual follows
 */
export async function getMutualFollowsAction(userId: string) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

    const follows = await getMutualFollows(userId);
    return { success: true, follows };
  } catch (error) {
    console.error('Error getting mutual follows:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mutual follows',
    };
  }
}

/**
 * Remove a follower
 */
export async function removeFollowerAction(userId: string, followerId: string) {
  try {
    if (shouldRequireFirestore()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);
    userIdSchema.parse(followerId);

    await removeFollower(userId, followerId);
    return { success: true };
  } catch (error) {
    console.error('Error removing follower:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove follower',
    };
  }
}
