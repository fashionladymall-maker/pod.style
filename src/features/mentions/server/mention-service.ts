import { getDb } from '@/lib/firebase-admin';
import type { Mention } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { createNotification } from '@/features/notifications/server/notification-service';

const MENTIONS_COLLECTION = 'mentions';
const USERS_COLLECTION = 'users';

/**
 * Extract mentions from text
 * Matches @username or @userId patterns
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@([\w\u4e00-\u9fa5]+)/g;
  const matches = text.match(mentionRegex);
  
  if (!matches) return [];
  
  // Remove @ and deduplicate
  return [...new Set(matches.map(mention => mention.slice(1)))];
}

/**
 * Find users by username or ID
 */
export async function findUsersByMention(mention: string): Promise<Array<{id: string; name: string; avatar?: string}>> {
  const db = getDb();
  
  // Search by name (case-insensitive)
  const nameSnapshot = await db
    .collection(USERS_COLLECTION)
    .orderBy('name')
    .startAt(mention.toLowerCase())
    .endAt(mention.toLowerCase() + '\uf8ff')
    .limit(5)
    .get();
  
  const users = nameSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name || 'Anonymous',
    avatar: doc.data().avatar,
  }));
  
  // Also check if mention matches a user ID
  const idDoc = await db.collection(USERS_COLLECTION).doc(mention).get();
  if (idDoc.exists) {
    const userData = idDoc.data();
    const user = {
      id: idDoc.id,
      name: userData?.name || 'Anonymous',
      avatar: userData?.avatar,
    };
    
    // Add if not already in results
    if (!users.find(u => u.id === user.id)) {
      users.unshift(user);
    }
  }
  
  return users;
}

/**
 * Create mentions from text
 */
export async function createMentionsFromText(
  text: string,
  mentionerUserId: string,
  creationId?: string,
  commentId?: string
): Promise<Mention[]> {
  const db = getDb();
  const mentionTexts = extractMentions(text);
  
  if (mentionTexts.length === 0) return [];
  
  const mentions: Mention[] = [];
  
  for (const mentionText of mentionTexts) {
    // Find users matching this mention
    const users = await findUsersByMention(mentionText);
    
    for (const user of users) {
      // Don't mention yourself
      if (user.id === mentionerUserId) continue;
      
      // Create mention record
      const mention: Mention = {
        id: uuidv4(),
        mentionedUserId: user.id,
        mentionedUserName: user.name,
        mentionerUserId,
        commentId,
        creationId,
        createdAt: new Date().toISOString(),
      };
      
      await db.collection(MENTIONS_COLLECTION).doc(mention.id).set(mention);
      mentions.push(mention);
      
      // Create notification
      try {
        await createNotification({
          userId: user.id,
          type: 'reply',
          title: '新的提及',
          message: commentId ? '在评论中提到了你' : '在创作中提到了你',
          actorId: mentionerUserId,
          relatedId: commentId || creationId,
          link: creationId ? `/creation/${creationId}` : undefined,
        });
      } catch (error) {
        console.error('Failed to create mention notification:', error);
      }
    }
  }
  
  return mentions;
}

/**
 * Get mentions for a user
 */
export async function getMentionsForUser(
  userId: string,
  limit: number = 20
): Promise<Mention[]> {
  const db = getDb();
  
  const snapshot = await db
    .collection(MENTIONS_COLLECTION)
    .where('mentionedUserId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Mention);
}

/**
 * Get mentions in a comment
 */
export async function getMentionsInComment(commentId: string): Promise<Mention[]> {
  const db = getDb();
  
  const snapshot = await db
    .collection(MENTIONS_COLLECTION)
    .where('commentId', '==', commentId)
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Mention);
}

/**
 * Get mentions in a creation
 */
export async function getMentionsInCreation(creationId: string): Promise<Mention[]> {
  const db = getDb();
  
  const snapshot = await db
    .collection(MENTIONS_COLLECTION)
    .where('creationId', '==', creationId)
    .get();
  
  return snapshot.docs.map(doc => doc.data() as Mention);
}

/**
 * Delete mentions for a comment
 */
export async function deleteMentionsForComment(commentId: string): Promise<void> {
  const db = getDb();
  
  const snapshot = await db
    .collection(MENTIONS_COLLECTION)
    .where('commentId', '==', commentId)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

/**
 * Parse text and highlight mentions
 * Returns text with mentions wrapped in special markers
 */
export function highlightMentions(text: string): string {
  return text.replace(/@([\w\u4e00-\u9fa5]+)/g, '<mention>@$1</mention>');
}

/**
 * Search users for mention suggestions
 */
export async function searchUsersForMention(
  query: string,
  limit: number = 5
): Promise<Array<{id: string; name: string; avatar?: string}>> {
  const db = getDb();
  
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase();
  
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .orderBy('name')
    .startAt(normalizedQuery)
    .endAt(normalizedQuery + '\uf8ff')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name || 'Anonymous',
    avatar: doc.data().avatar,
  }));
}
