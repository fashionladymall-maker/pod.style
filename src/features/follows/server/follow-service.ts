"use server";

import { getDb } from '@/lib/firebase-admin';
import type { Follow, FollowInput, FollowStats } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { createFollowNotification } from '@/features/notifications/server/notification-service';

const FOLLOWS_COLLECTION = 'follows';
const USERS_COLLECTION = 'users';

/**
 * Follow a user
 */
export async function followUser(input: FollowInput): Promise<Follow> {
  const db = getDb();
  
  // Check if already following
  const existingFollow = await db
    .collection(FOLLOWS_COLLECTION)
    .where('followerId', '==', input.followerId)
    .where('followingId', '==', input.followingId)
    .limit(1)
    .get();

  if (!existingFollow.empty) {
    // Already following, return existing
    const doc = existingFollow.docs[0];
    return { id: doc.id, ...doc.data() } as Follow;
  }

  // Get user info
  const [followerDoc, followingDoc] = await Promise.all([
    db.collection(USERS_COLLECTION).doc(input.followerId).get(),
    db.collection(USERS_COLLECTION).doc(input.followingId).get(),
  ]);

  const followerData = followerDoc.data();
  const followingData = followingDoc.data();

  const follow: Follow = {
    id: uuidv4(),
    followerId: input.followerId,
    followingId: input.followingId,
    followerName: followerData?.name || 'Anonymous',
    followerAvatar: followerData?.avatar,
    followingName: followingData?.name || 'Anonymous',
    followingAvatar: followingData?.avatar,
    createdAt: new Date().toISOString(),
  };

  // Save follow relationship
  await db.collection(FOLLOWS_COLLECTION).doc(follow.id).set(follow);

  // Update user stats
  await Promise.all([
    // Update follower's following count
    db.collection(USERS_COLLECTION).doc(input.followerId).update({
      followingCount: (followerData?.followingCount || 0) + 1,
    }),
    // Update following's followers count
    db.collection(USERS_COLLECTION).doc(input.followingId).update({
      followersCount: (followingData?.followersCount || 0) + 1,
    }),
  ]);

  // Create notification
  try {
    await createFollowNotification(input.followingId, input.followerId);
  } catch (error) {
    console.error('Failed to create follow notification:', error);
  }

  return follow;
}

/**
 * Unfollow a user
 */
export async function unfollowUser(input: FollowInput): Promise<void> {
  const db = getDb();

  // Find the follow relationship
  const followQuery = await db
    .collection(FOLLOWS_COLLECTION)
    .where('followerId', '==', input.followerId)
    .where('followingId', '==', input.followingId)
    .limit(1)
    .get();

  if (followQuery.empty) {
    throw new Error('Follow relationship not found');
  }

  const followDoc = followQuery.docs[0];
  
  // Delete the follow relationship
  await followDoc.ref.delete();

  // Update user stats
  const [followerDoc, followingDoc] = await Promise.all([
    db.collection(USERS_COLLECTION).doc(input.followerId).get(),
    db.collection(USERS_COLLECTION).doc(input.followingId).get(),
  ]);

  const followerData = followerDoc.data();
  const followingData = followingDoc.data();

  await Promise.all([
    // Update follower's following count
    db.collection(USERS_COLLECTION).doc(input.followerId).update({
      followingCount: Math.max(0, (followerData?.followingCount || 0) - 1),
    }),
    // Update following's followers count
    db.collection(USERS_COLLECTION).doc(input.followingId).update({
      followersCount: Math.max(0, (followingData?.followersCount || 0) - 1),
    }),
  ]);
}

/**
 * Check if user is following another user
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const db = getDb();

  const followQuery = await db
    .collection(FOLLOWS_COLLECTION)
    .where('followerId', '==', followerId)
    .where('followingId', '==', followingId)
    .limit(1)
    .get();

  return !followQuery.empty;
}

/**
 * Get follow stats for a user
 */
export async function getFollowStats(userId: string, currentUserId?: string): Promise<FollowStats> {
  const db = getDb();

  // Get user's following and followers counts
  const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
  const userData = userDoc.data();

  const stats: FollowStats = {
    followingCount: userData?.followingCount || 0,
    followersCount: userData?.followersCount || 0,
  };

  // If currentUserId is provided, check follow relationships
  if (currentUserId && currentUserId !== userId) {
    const [isFollowingResult, isFollowedByResult] = await Promise.all([
      isFollowing(currentUserId, userId),
      isFollowing(userId, currentUserId),
    ]);

    stats.isFollowing = isFollowingResult;
    stats.isFollowedBy = isFollowedByResult;
  }

  return stats;
}

/**
 * Get list of users that a user is following
 */
export async function getFollowing(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ follows: Follow[]; hasMore: boolean }> {
  const db = getDb();

  const queryLimit = limit * Math.max(page, 1) + 1;

  const query = db
    .collection(FOLLOWS_COLLECTION)
    .where('followerId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(queryLimit);

  const snapshot = await query.get();
  const startIndex = (Math.max(page, 1) - 1) * limit;
  const paginatedDocs = snapshot.docs.slice(startIndex, startIndex + limit);
  const follows = paginatedDocs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Follow[];

  return {
    follows,
    hasMore: snapshot.docs.length > startIndex + limit,
  };
}

/**
 * Get list of users following a user (followers)
 */
export async function getFollowers(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ follows: Follow[]; hasMore: boolean }> {
  const db = getDb();

  const queryLimit = limit * Math.max(page, 1) + 1;

  const query = db
    .collection(FOLLOWS_COLLECTION)
    .where('followingId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(queryLimit);

  const snapshot = await query.get();
  const startIndex = (Math.max(page, 1) - 1) * limit;
  const paginatedDocs = snapshot.docs.slice(startIndex, startIndex + limit);
  const follows = paginatedDocs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Follow[];

  return {
    follows,
    hasMore: snapshot.docs.length > startIndex + limit,
  };
}

/**
 * Get mutual follows (users who follow each other)
 */
export async function getMutualFollows(userId: string): Promise<Follow[]> {
  const db = getDb();

  // Get users that userId is following
  const followingSnapshot = await db
    .collection(FOLLOWS_COLLECTION)
    .where('followerId', '==', userId)
    .get();

  const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);

  if (followingIds.length === 0) {
    return [];
  }

  // Get users who are also following userId back
  const mutualFollows: Follow[] = [];
  
  for (const followingId of followingIds) {
    const isFollowingBack = await isFollowing(followingId, userId);
    if (isFollowingBack) {
      const followDoc = followingSnapshot.docs.find(
        doc => doc.data().followingId === followingId
      );
      if (followDoc) {
        mutualFollows.push({
          id: followDoc.id,
          ...followDoc.data(),
        } as Follow);
      }
    }
  }

  return mutualFollows;
}

/**
 * Remove a follower
 */
export async function removeFollower(userId: string, followerId: string): Promise<void> {
  await unfollowUser({ followerId, followingId: userId });
}
