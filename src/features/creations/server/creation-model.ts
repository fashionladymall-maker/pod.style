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
  models: z.array(modelSchema),
  createdAt: z.instanceof(Timestamp),
  isPublic: z.boolean(),
  orderCount: z.number().int(),
  likeCount: z.number().int(),
  likedBy: z.array(z.string()),
  favoriteCount: z.number().int(),
  favoritedBy: z.array(z.string()),
  commentCount: z.number().int(),
  shareCount: z.number().int(),
  remakeCount: z.number().int(),
});

export type CreationDocument = z.infer<typeof creationDataSchema>;

export const toCreation = (id: string, data: CreationDocument): Creation => ({
  id,
  userId: data.userId,
  prompt: data.prompt,
  style: data.style,
  summary: data.summary,
  patternUri: data.patternUri,
  previewPatternUri: data.previewPatternUri,
  models: data.models,
  createdAt: data.createdAt.toDate().toISOString(),
  isPublic: data.isPublic,
  orderCount: data.orderCount,
  likeCount: data.likeCount,
  likedBy: data.likedBy,
  favoriteCount: data.favoriteCount,
  favoritedBy: data.favoritedBy,
  commentCount: data.commentCount,
  shareCount: data.shareCount,
  remakeCount: data.remakeCount,
});

export const nowTimestamp = () => Timestamp.fromDate(new Date());
