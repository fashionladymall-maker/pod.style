"use server";

import { getDb } from '@/lib/firebase-admin';
import type { Comment, CommentInput } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const COMMENTS_COLLECTION = 'comments';
const CREATIONS_COLLECTION = 'creations';
const USERS_COLLECTION = 'users';

/**
 * Add a new comment
 */
export async function addComment(input: CommentInput): Promise<Comment> {
  const db = getDb();
  
  // Get user info
  const userDoc = await db.collection(USERS_COLLECTION).doc(input.userId).get();
  const userData = userDoc.data();
  
  const comment: Comment = {
    id: uuidv4(),
    creationId: input.creationId,
    userId: input.userId,
    userName: userData?.name || 'Anonymous',
    userAvatar: userData?.avatar,
    content: input.content,
    likeCount: 0,
    likedBy: [],
    replyCount: 0,
    parentId: input.parentId,
    createdAt: new Date().toISOString(),
    isDeleted: false,
  };

  // Save comment
  await db.collection(COMMENTS_COLLECTION).doc(comment.id).set(comment);

  // Update creation comment count
  const creationRef = db.collection(CREATIONS_COLLECTION).doc(input.creationId);
  await creationRef.update({
    commentCount: (await creationRef.get()).data()?.commentCount || 0 + 1,
  });

  // If it's a reply, update parent comment reply count
  if (input.parentId) {
    const parentRef = db.collection(COMMENTS_COLLECTION).doc(input.parentId);
    await parentRef.update({
      replyCount: (await parentRef.get()).data()?.replyCount || 0 + 1,
    });
  }

  return comment;
}

/**
 * Get comments for a creation
 */
export async function getComments(
  creationId: string,
  sortBy: 'latest' | 'popular' = 'latest',
  page: number = 1,
  pageSize: number = 20
): Promise<{ comments: Comment[]; total: number; hasMore: boolean }> {
  const db = getDb();
  
  let query = db
    .collection(COMMENTS_COLLECTION)
    .where('creationId', '==', creationId)
    .where('isDeleted', '==', false)
    .where('parentId', '==', null); // Only top-level comments

  // Sort
  if (sortBy === 'latest') {
    query = query.orderBy('createdAt', 'desc');
  } else {
    query = query.orderBy('likeCount', 'desc');
  }

  // Pagination
  const offset = (page - 1) * pageSize;
  query = query.offset(offset).limit(pageSize + 1);

  const snapshot = await query.get();
  const comments = snapshot.docs.slice(0, pageSize).map(doc => doc.data() as Comment);
  const hasMore = snapshot.docs.length > pageSize;

  // Get total count
  const totalSnapshot = await db
    .collection(COMMENTS_COLLECTION)
    .where('creationId', '==', creationId)
    .where('isDeleted', '==', false)
    .where('parentId', '==', null)
    .count()
    .get();
  const total = totalSnapshot.data().count;

  return { comments, total, hasMore };
}

/**
 * Get replies for a comment
 */
export async function getReplies(
  parentId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ replies: Comment[]; total: number; hasMore: boolean }> {
  const db = getDb();
  
  let query = db
    .collection(COMMENTS_COLLECTION)
    .where('parentId', '==', parentId)
    .where('isDeleted', '==', false)
    .orderBy('createdAt', 'asc');

  // Pagination
  const offset = (page - 1) * pageSize;
  query = query.offset(offset).limit(pageSize + 1);

  const snapshot = await query.get();
  const replies = snapshot.docs.slice(0, pageSize).map(doc => doc.data() as Comment);
  const hasMore = snapshot.docs.length > pageSize;

  // Get total count
  const totalSnapshot = await db
    .collection(COMMENTS_COLLECTION)
    .where('parentId', '==', parentId)
    .where('isDeleted', '==', false)
    .count()
    .get();
  const total = totalSnapshot.data().count;

  return { replies, total, hasMore };
}

/**
 * Toggle comment like
 */
export async function toggleCommentLike(
  commentId: string,
  userId: string,
  isLiked: boolean
): Promise<void> {
  const db = getDb();
  const commentRef = db.collection(COMMENTS_COLLECTION).doc(commentId);
  const commentDoc = await commentRef.get();
  const commentData = commentDoc.data() as Comment;

  if (!commentData) {
    throw new Error('Comment not found');
  }

  const likedBy = commentData.likedBy || [];
  const likeCount = commentData.likeCount || 0;

  if (isLiked) {
    // Add like
    if (!likedBy.includes(userId)) {
      await commentRef.update({
        likedBy: [...likedBy, userId],
        likeCount: likeCount + 1,
      });
    }
  } else {
    // Remove like
    if (likedBy.includes(userId)) {
      await commentRef.update({
        likedBy: likedBy.filter(id => id !== userId),
        likeCount: Math.max(0, likeCount - 1),
      });
    }
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const db = getDb();
  const commentRef = db.collection(COMMENTS_COLLECTION).doc(commentId);
  const commentDoc = await commentRef.get();
  const commentData = commentDoc.data() as Comment;

  if (!commentData) {
    throw new Error('Comment not found');
  }

  // Check if user owns the comment
  if (commentData.userId !== userId) {
    throw new Error('Unauthorized');
  }

  // Soft delete
  await commentRef.update({
    isDeleted: true,
    content: '[已删除]',
  });

  // Update creation comment count
  const creationRef = db.collection(CREATIONS_COLLECTION).doc(commentData.creationId);
  const creationDoc = await creationRef.get();
  const creationData = creationDoc.data();
  await creationRef.update({
    commentCount: Math.max(0, (creationData?.commentCount || 0) - 1),
  });

  // If it's a reply, update parent comment reply count
  if (commentData.parentId) {
    const parentRef = db.collection(COMMENTS_COLLECTION).doc(commentData.parentId);
    const parentDoc = await parentRef.get();
    const parentData = parentDoc.data();
    await parentRef.update({
      replyCount: Math.max(0, (parentData?.replyCount || 0) - 1),
    });
  }
}

/**
 * Report a comment
 */
export async function reportComment(
  commentId: string,
  userId: string,
  reason: string
): Promise<void> {
  const db = getDb();
  
  const report = {
    id: uuidv4(),
    commentId,
    userId,
    reason,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  await db.collection('comment_reports').doc(report.id).set(report);
}

