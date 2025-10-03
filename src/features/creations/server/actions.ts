"use server";

import { z } from 'zod';
import {
  addComment,
  deleteModel,
  forkCreation,
  generateModel,
  generatePattern,
  getComments,
  getPersonalizedFeeds,
  getPublicCreations,
  getTrendingCreations,
  getUserCreations,
  incrementMetric,
  logInteraction,
  removeCreation,
  toggleCreationPublicStatus,
  toggleFavorite,
  toggleLike,
  toggleModelVisibility,
  type CommentInput,
  type DeleteModelInput,
  type ForkCreationInput,
  type LogInteractionInput,
  type ToggleModelVisibilityInput,
} from './creation-service';
import { isFirebaseAdminConfigured } from '@/server/firebase/admin';

const ensureFirestore = () => {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Firebase Admin SDK is not configured.');
  }
};

const generatePatternSchema = z.object({
  userId: z.string(),
  prompt: z.string().min(3),
  style: z.string().min(1),
  referenceImage: z.string().url().optional().nullable(),
});

export const generatePatternAction = async (input: z.infer<typeof generatePatternSchema>) => {
  ensureFirestore();
  const payload = generatePatternSchema.parse(input);
  return generatePattern({
    userId: payload.userId,
    prompt: payload.prompt,
    style: payload.style,
    referenceImage: payload.referenceImage ?? undefined,
  });
};

const generateModelSchema = z.object({
  creationId: z.string(),
  userId: z.string(),
  patternDataUri: z.string().url(),
  category: z.string(),
  colorName: z.string(),
});

export const generateModelAction = async (input: z.infer<typeof generateModelSchema>) => {
  ensureFirestore();
  const payload = generateModelSchema.parse(input);
  return generateModel({
    creationId: payload.creationId,
    userId: payload.userId,
    patternDataUri: payload.patternDataUri,
    category: payload.category,
    colorName: payload.colorName,
  });
};

export const getCreationsAction = async (userId: string) => {
  ensureFirestore();
  return getUserCreations(userId);
};

const forkSchema = z.object({
  sourceCreationId: z.string(),
  userId: z.string(),
});

export const forkCreationAction = async (input: ForkCreationInput) => {
  ensureFirestore();
  return forkCreation(forkSchema.parse(input));
};

const deleteModelSchema = z.object({
  creationId: z.string(),
  modelUri: z.string().url(),
});

export const deleteCreationModelAction = async (input: DeleteModelInput) => {
  ensureFirestore();
  return deleteModel(deleteModelSchema.parse(input));
};

const toggleModelVisibilitySchema = z.object({
  creationId: z.string(),
  modelUri: z.string().url(),
  isPublic: z.boolean(),
});

export const toggleCreationModelVisibilityAction = async (input: ToggleModelVisibilityInput) => {
  ensureFirestore();
  return toggleModelVisibility(toggleModelVisibilitySchema.parse(input));
};

const logInteractionSchema = z.object({
  userId: z.string().nullable(),
  creationId: z.string(),
  action: z.enum(['view', 'like', 'favorite', 'share', 'order', 'comment', 'remake']),
  weight: z.number().optional(),
  modelUri: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const logCreationInteractionAction = async (input: LogInteractionInput) => {
  ensureFirestore();
  await logInteraction(logInteractionSchema.parse(input));
};

export const getPersonalizedFeedsAction = async (userId: string | null) => {
  ensureFirestore();
  return getPersonalizedFeeds(userId);
};

export const deleteCreationAction = async (creationId: string) => {
  ensureFirestore();
  await removeCreation(creationId);
  return { success: true };
};

const togglePublicSchema = z.object({
  creationId: z.string(),
  isPublic: z.boolean(),
});

export const toggleCreationPublicStatusAction = async (creationId: string, isPublic: boolean) => {
  ensureFirestore();
  togglePublicSchema.parse({ creationId, isPublic });
  await toggleCreationPublicStatus(creationId, isPublic);
  return { success: true };
};

export const getPublicCreationsAction = async (limit: number = 20) => {
  ensureFirestore();
  return getPublicCreations(limit);
};

export const getTrendingCreationsAction = async (limit: number = 20) => {
  ensureFirestore();
  return getTrendingCreations(limit);
};

const toggleLikeSchema = z.object({
  creationId: z.string(),
  userId: z.string(),
  isLiked: z.boolean(),
});

export const toggleLikeAction = async (creationId: string, userId: string, isLiked: boolean) => {
  ensureFirestore();
  toggleLikeSchema.parse({ creationId, userId, isLiked });
  return toggleLike({ creationId, userId, isLiked });
};

const toggleFavoriteSchema = z.object({
  creationId: z.string(),
  userId: z.string(),
  isFavorited: z.boolean(),
});

export const toggleFavoriteAction = async (creationId: string, userId: string, isFavorited: boolean) => {
  ensureFirestore();
  toggleFavoriteSchema.parse({ creationId, userId, isFavorited });
  return toggleFavorite({ creationId, userId, isFavorited });
};

export const addCommentAction = async (creationId: string, commentData: CommentInput['commentData']) => {
  ensureFirestore();
  const schema = z.object({
    creationId: z.string(),
    commentData: z.object({
      userId: z.string(),
      userName: z.string(),
      userPhotoURL: z.string().optional().default(''),
      content: z.string().min(1),
    }),
  });

  const payload = schema.parse({ creationId, commentData });
  return addComment(payload);
};

export const getCommentsAction = async (creationId: string) => {
  ensureFirestore();
  z.string().parse(creationId);
  return getComments(creationId);
};

export const incrementShareCountAction = async (creationId: string) => {
  ensureFirestore();
  z.string().parse(creationId);
  return incrementMetric(creationId, 'shareCount');
};

export const incrementRemakeCountAction = async (creationId: string) => {
  ensureFirestore();
  z.string().parse(creationId);
  return incrementMetric(creationId, 'remakeCount');
};
