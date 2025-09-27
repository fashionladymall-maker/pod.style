"use server";

import { z } from 'zod';
import { isFirebaseAdminConfigured } from '@/server/firebase/admin';
import {
  ensureUserFineTunedModel,
  markUserFineTunedModelAsUsed,
  updateUserFineTunedModelSettings,
} from './user-model-service';

const ensureFirestore = () => {
  if (!isFirebaseAdminConfigured()) {
    throw new Error('Firebase Admin SDK is not configured.');
  }
};

const userIdSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

export const getUserFineTunedModelAction = async (userId: string) => {
  ensureFirestore();
  const { userId: parsedUserId } = userIdSchema.parse({ userId });
  return ensureUserFineTunedModel(parsedUserId);
};

const personalizationSchema = z
  .object({
    strength: z.number().min(0).max(1),
    tags: z.array(z.string()).default([]),
    preferredStyles: z.array(z.string()).optional(),
  })
  .partial();

const updateSchema = userIdSchema.extend({
  modelName: z.string().optional(),
  displayName: z.string().optional(),
  provider: z.enum(['googleai', 'openai', 'custom']).optional(),
  baseModel: z.string().optional(),
  status: z.enum(['training', 'ready', 'failed']).optional(),
  personalization: personalizationSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateUserFineTunedModelAction = async (
  input: z.infer<typeof updateSchema>
) => {
  ensureFirestore();
  const payload = updateSchema.parse(input);
  return updateUserFineTunedModelSettings(payload.userId, {
    modelName: payload.modelName,
    displayName: payload.displayName,
    provider: payload.provider,
    baseModel: payload.baseModel,
    status: payload.status,
    personalization: payload.personalization,
    metadata: payload.metadata,
  });
};

export const touchUserFineTunedModelUsageAction = async (userId: string) => {
  ensureFirestore();
  const { userId: parsedUserId } = userIdSchema.parse({ userId });
  return markUserFineTunedModelAsUsed(parsedUserId);
};
