import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import type { Creation } from '@/lib/types';

export const modelSchema = z.object({
  uri: z.string(),
  category: z.string(),
  isPublic: z.boolean().optional(),
  previewUri: z.string().optional(),
});

export const creationDataSchema = z.object({
  userId: z.string(),
  prompt: z.string(),
  style: z.string(),
  summary: z.string().optional(),
  patternUri: z.string(),
  previewPatternUri: z.string().optional(),
  models: z.array(modelSchema).default([]),
  createdAt: z.instanceof(Timestamp),
  isPublic: z.boolean(),
  orderCount: z.number().int().optional(),
  likeCount: z.number().int().optional(),
  likedBy: z.array(z.string()).optional(),
  favoriteCount: z.number().int().optional(),
  favoritedBy: z.array(z.string()).optional(),
  commentCount: z.number().int().optional(),
  shareCount: z.number().int().optional(),
  remakeCount: z.number().int().optional(),
}).transform((data) => ({
  ...data,
  // Ensure all numeric fields have default values for backward compatibility
  models: data.models ?? [],
  orderCount: data.orderCount ?? 0,
  likeCount: data.likeCount ?? 0,
  likedBy: data.likedBy ?? [],
  favoriteCount: data.favoriteCount ?? 0,
  favoritedBy: data.favoritedBy ?? [],
  commentCount: data.commentCount ?? 0,
  shareCount: data.shareCount ?? 0,
  remakeCount: data.remakeCount ?? 0,
}));

export type CreationDocument = z.infer<typeof creationDataSchema>;

export const toCreation = (id: string, data: CreationDocument): Creation => ({
  id,
  userId: data.userId,
  prompt: data.prompt,
  style: data.style,
  summary: data.summary,
  patternUri: data.patternUri,
  previewPatternUri: data.previewPatternUri,
  models: data.models || [],
  createdAt: data.createdAt.toDate().toISOString(),
  isPublic: data.isPublic,
  orderCount: data.orderCount || 0,
  likeCount: data.likeCount || 0,
  likedBy: data.likedBy || [],
  favoriteCount: data.favoriteCount || 0,
  favoritedBy: data.favoritedBy || [],
  commentCount: data.commentCount || 0,
  shareCount: data.shareCount || 0,
  remakeCount: data.remakeCount || 0,
});

export const nowTimestamp = () => Timestamp.fromDate(new Date());
