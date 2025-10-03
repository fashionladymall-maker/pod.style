"use server";

import { getDb } from '@/lib/firebase-admin';

const USERS_COLLECTION = 'users';

export interface UserProfile {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
  email?: string;
  createdAt: string;
  updatedAt?: string;
  followingCount?: number;
  followersCount?: number;
}

export interface UpdateUserProfileInput {
  userId: string;
  name?: string;
  bio?: string;
  avatar?: string;
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = getDb();
  
  const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
  
  if (!userDoc.exists) {
    return null;
  }
  
  const data = userDoc.data();
  return {
    id: userDoc.id,
    name: data?.name || 'Anonymous',
    bio: data?.bio,
    avatar: data?.avatar,
    email: data?.email,
    createdAt: data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt,
    followingCount: data?.followingCount || 0,
    followersCount: data?.followersCount || 0,
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
  const db = getDb();
  
  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };
  
  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  
  if (input.bio !== undefined) {
    updateData.bio = input.bio;
  }
  
  if (input.avatar !== undefined) {
    updateData.avatar = input.avatar;
  }
  
  // Update user document
  await db.collection(USERS_COLLECTION).doc(input.userId).update(updateData);
  
  // Get updated profile
  const profile = await getUserProfile(input.userId);
  
  if (!profile) {
    throw new Error('Failed to get updated profile');
  }
  
  return profile;
}

/**
 * Create user profile (if not exists)
 */
export async function createUserProfile(userId: string, email?: string, name?: string): Promise<UserProfile> {
  const db = getDb();
  
  // Check if user already exists
  const existingUser = await getUserProfile(userId);
  if (existingUser) {
    return existingUser;
  }
  
  const profile: UserProfile = {
    id: userId,
    name: name || email?.split('@')[0] || 'User',
    email,
    createdAt: new Date().toISOString(),
    followingCount: 0,
    followersCount: 0,
  };
  
  await db.collection(USERS_COLLECTION).doc(userId).set(profile);
  
  return profile;
}

/**
 * Upload avatar to base64 (simplified version)
 * In production, you should upload to Firebase Storage or CDN
 */
export async function uploadAvatar(userId: string, base64Image: string): Promise<string> {
  // For now, we'll just return the base64 string
  // In production, upload to Firebase Storage and return the URL
  
  // Validate base64 image
  if (!base64Image.startsWith('data:image/')) {
    throw new Error('Invalid image format');
  }
  
  // In production:
  // 1. Upload to Firebase Storage
  // 2. Get download URL
  // 3. Return URL
  
  return base64Image;
}

/**
 * Search users by name
 */
export async function searchUsers(query: string, limit: number = 20): Promise<UserProfile[]> {
  const db = getDb();
  
  if (!query.trim()) {
    return [];
  }
  
  // Simple search by name (case-insensitive)
  // In production, use Algolia or Elasticsearch for better search
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .orderBy('name')
    .limit(limit)
    .get();
  
  const users = snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as UserProfile))
    .filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase())
    );
  
  return users;
}

/**
 * Get multiple users by IDs
 */
export async function getUsersByIds(userIds: string[]): Promise<UserProfile[]> {
  const db = getDb();
  
  if (userIds.length === 0) {
    return [];
  }
  
  const users: UserProfile[] = [];
  
  // Firestore 'in' query supports max 10 items
  const chunks = [];
  for (let i = 0; i < userIds.length; i += 10) {
    chunks.push(userIds.slice(i, i + 10));
  }
  
  for (const chunk of chunks) {
    const snapshot = await db
      .collection(USERS_COLLECTION)
      .where('__name__', 'in', chunk)
      .get();
    
    snapshot.docs.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data(),
      } as UserProfile);
    });
  }
  
  return users;
}

