import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import type {
  UserFineTunedModel,
  UserFineTunedModelData,
  UserFineTunedModelPersonalization,
} from '@/lib/types';

const PROVIDERS = ['googleai', 'openai', 'custom'] as const;
const STATUSES = ['training', 'ready', 'failed'] as const;

const personalizationSchema = z.object({
  strength: z.number().min(0).max(1),
  tags: z.array(z.string()),
  preferredStyles: z.array(z.string()).optional(),
});

export const userFineTunedModelSchema = z.object({
  userId: z.string(),
  modelName: z.string(),
  displayName: z.string(),
  provider: z.enum(PROVIDERS),
  baseModel: z.string(),
  status: z.enum(STATUSES),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
  lastUsedAt: z.instanceof(Timestamp).optional(),
  personalization: personalizationSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UserFineTunedModelDocument = z.infer<typeof userFineTunedModelSchema>;

export const toUserFineTunedModel = (data: UserFineTunedModelDocument): UserFineTunedModel => ({
  userId: data.userId,
  modelName: data.modelName,
  displayName: data.displayName,
  provider: data.provider,
  baseModel: data.baseModel,
  status: data.status,
  createdAt: data.createdAt.toDate().toISOString(),
  updatedAt: data.updatedAt.toDate().toISOString(),
  lastUsedAt: data.lastUsedAt?.toDate().toISOString(),
  personalization: data.personalization as UserFineTunedModelPersonalization | undefined,
  metadata: data.metadata,
});

export const toUserFineTunedModelData = (
  model: UserFineTunedModelData | UserFineTunedModelDocument
): UserFineTunedModelData => ({
  userId: model.userId,
  modelName: model.modelName,
  displayName: model.displayName,
  provider: model.provider,
  baseModel: model.baseModel,
  status: model.status,
  createdAt: model.createdAt instanceof Timestamp ? model.createdAt : Timestamp.fromDate(new Date(model.createdAt)),
  updatedAt: model.updatedAt instanceof Timestamp ? model.updatedAt : Timestamp.fromDate(new Date(model.updatedAt)),
  lastUsedAt:
    model.lastUsedAt instanceof Timestamp || model.lastUsedAt === undefined
      ? model.lastUsedAt
      : Timestamp.fromDate(new Date(model.lastUsedAt)),
  personalization: model.personalization,
  metadata: model.metadata,
});
