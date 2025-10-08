import { Timestamp } from 'firebase-admin/firestore';
import { isFirebaseAdminConfigured } from '@/server/firebase/admin';
import type { UserFineTunedModel, UserFineTunedModelData } from '@/lib/types';
import {
  createUserFineTunedModel,
  findUserFineTunedModel,
  updateUserFineTunedModel,
} from './user-model-repository';
import {
  mockEnsureUserFineTunedModel,
  mockUpdateUserFineTunedModel,
  mockMarkUserFineTunedModelUsed,
} from '@/server/mock/mock-store';

const createDefaultModelData = (userId: string): UserFineTunedModelData => {
  const now = Timestamp.fromDate(new Date());
  const baseModel = 'googleai/gemini-2.5-flash-image-preview';
  return {
    userId,
    modelName: baseModel,
    displayName: '专属微调模型',
    provider: 'googleai',
    baseModel,
    status: 'ready',
    createdAt: now,
    updatedAt: now,
    lastUsedAt: now,
    personalization: {
      strength: 0.6,
      tags: [],
    },
    metadata: {
      initializedAutomatically: true,
      personalizedModelPath: `users/${userId}/models/personalized`,
    },
  };
};

export const ensureUserFineTunedModel = async (userId: string): Promise<UserFineTunedModel> => {
  if (!isFirebaseAdminConfigured()) {
    return mockEnsureUserFineTunedModel(userId);
  }
  const existing = await findUserFineTunedModel(userId);
  if (existing) {
    return existing;
  }
  const defaults = createDefaultModelData(userId);
  return createUserFineTunedModel(defaults);
};

interface UpdateUserFineTunedModelInput {
  modelName?: string;
  displayName?: string;
  provider?: UserFineTunedModelData['provider'];
  baseModel?: string;
  status?: UserFineTunedModelData['status'];
  personalization?: Partial<UserFineTunedModelData['personalization']>;
  metadata?: Record<string, unknown>;
}

export const updateUserFineTunedModelSettings = async (
  userId: string,
  updates: UpdateUserFineTunedModelInput
): Promise<UserFineTunedModel> => {
  if (!isFirebaseAdminConfigured()) {
    const current = mockEnsureUserFineTunedModel(userId);
    const partial: Partial<UserFineTunedModel> = {
      modelName: updates.modelName,
      displayName: updates.displayName,
      provider: updates.provider,
      baseModel: updates.baseModel,
      status: updates.status,
      personalization: updates.personalization
        ? {
            strength: updates.personalization.strength ?? current.personalization?.strength ?? 0.6,
            tags: updates.personalization.tags ?? current.personalization?.tags ?? [],
            preferredStyles:
              updates.personalization.preferredStyles ?? current.personalization?.preferredStyles ?? [],
          }
        : undefined,
      metadata: updates.metadata,
    };
    return mockUpdateUserFineTunedModel(userId, partial);
  }
  const existing = await ensureUserFineTunedModel(userId);
  const now = Timestamp.fromDate(new Date());
  const partial: Partial<UserFineTunedModelData> = {
    updatedAt: now,
  };

  if (updates.modelName) {
    partial.modelName = updates.modelName;
  }
  if (updates.displayName) {
    partial.displayName = updates.displayName;
  }
  if (updates.provider) {
    partial.provider = updates.provider;
  }
  if (updates.baseModel) {
    partial.baseModel = updates.baseModel;
  }
  if (updates.status) {
    partial.status = updates.status;
  }
  if (updates.personalization) {
    const personalization = {
      strength:
        updates.personalization.strength ?? existing.personalization?.strength ?? 0.6,
      tags: updates.personalization.tags ?? existing.personalization?.tags ?? [],
      preferredStyles:
        updates.personalization.preferredStyles ?? existing.personalization?.preferredStyles,
    };
    partial.personalization = personalization;
  }
  if (updates.metadata) {
    partial.metadata = {
      ...(existing.metadata ?? {}),
      ...updates.metadata,
    };
  }

  return updateUserFineTunedModel(userId, partial);
};

export const markUserFineTunedModelAsUsed = async (
  userId: string
): Promise<UserFineTunedModel> => {
  if (!isFirebaseAdminConfigured()) {
    return mockMarkUserFineTunedModelUsed(userId);
  }
  await ensureUserFineTunedModel(userId);
  const now = Timestamp.fromDate(new Date());
  return updateUserFineTunedModel(userId, {
    lastUsedAt: now,
    updatedAt: now,
  });
};
