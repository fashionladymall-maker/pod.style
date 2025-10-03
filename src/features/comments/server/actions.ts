"use server";

import { z } from 'zod';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  addComment,
  getComments,
  getReplies,
  toggleCommentLike,
  deleteComment,
  reportComment,
} from './comment-service';
import type { CommentInput } from '@/lib/types';

const ensureFirestore = () => {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Firebase Admin SDK is not configured.');
  }
};

const commentInputSchema = z.object({
  creationId: z.string(),
  userId: z.string(),
  content: z.string().min(1).max(500),
  parentId: z.string().optional(),
});

/**
 * Add a comment
 */
export const addCommentAction = async (input: CommentInput) => {
  ensureFirestore();
  const payload = commentInputSchema.parse(input);
  return addComment(payload);
};

/**
 * Get comments for a creation
 */
export const getCommentsAction = async (
  creationId: string,
  sortBy: 'latest' | 'popular' = 'latest',
  page: number = 1
) => {
  ensureFirestore();
  return getComments(creationId, sortBy, page);
};

/**
 * Get replies for a comment
 */
export const getRepliesAction = async (parentId: string, page: number = 1) => {
  ensureFirestore();
  return getReplies(parentId, page);
};

/**
 * Toggle comment like
 */
export const toggleCommentLikeAction = async (
  commentId: string,
  userId: string,
  isLiked: boolean
) => {
  ensureFirestore();
  return toggleCommentLike(commentId, userId, isLiked);
};

/**
 * Delete a comment
 */
export const deleteCommentAction = async (commentId: string, userId: string) => {
  ensureFirestore();
  return deleteComment(commentId, userId);
};

/**
 * Report a comment
 */
export const reportCommentAction = async (
  commentId: string,
  userId: string,
  reason: string
) => {
  ensureFirestore();
  return reportComment(commentId, userId, reason);
};

