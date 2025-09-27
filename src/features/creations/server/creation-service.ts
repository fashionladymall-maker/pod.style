import { Buffer } from 'node:buffer';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  generateTShirtPatternWithStyle,
  type GenerateTShirtPatternWithStyleInput,
} from '@/ai/flows/generate-t-shirt-pattern-with-style';
import { generateModelMockup, type GenerateModelMockupInput } from '@/ai/flows/generate-model-mockup';
import { summarizePrompt } from '@/ai/flows/summarize-prompt';
import type {
  Comment,
  CommentData,
  Creation,
  CreationData,
  Model,
} from '@/lib/types';
import { admin, getAdminStorage } from '@/server/firebase/admin';
import { logger } from '@/utils/logger';
import {
  createCreation,
  deleteCreation as deleteCreationDoc,
  findCreationById,
  getCollectionRef,
  listPublicCreations,
  listUserCreations,
  updateCreation,
} from './creation-repository';
import { nowTimestamp } from './creation-model';

const HOURS_TO_MS = 60 * 60 * 1000;

const calculateRecencyBoost = (createdAt: string | undefined) => {
  if (!createdAt) return 0;
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return 0;
  const ageInHours = (Date.now() - createdTime) / HOURS_TO_MS;
  if (ageInHours <= 0) return 50;
  return Math.max(0, 50 - Math.log10(ageInHours + 1) * 10);
};

const basePopularityScore = (creation: Creation, mode: 'popular' | 'trending') => {
  const {
    likeCount = 0,
    favoriteCount = 0,
    shareCount = 0,
    commentCount = 0,
    remakeCount = 0,
    orderCount = 0,
  } = creation;

  const engagement = likeCount * 2 + favoriteCount * 3 + shareCount + commentCount * 1.5 + remakeCount * 4;
  const orders = orderCount * 5;

  return mode === 'trending' ? orders + engagement * 0.8 : engagement + orders * 0.6;
};

const personalBoost = (creation: Creation, userId: string | null | undefined) => {
  if (!userId) return 0;
  let boost = 0;
  if (creation.userId === userId) boost += 60;
  if (creation.likedBy?.includes(userId)) boost += 35;
  if (creation.favoritedBy?.includes(userId)) boost += 30;
  if (creation.shareCount && creation.shareCount > 0) boost += 2;
  return boost;
};

const shuffleWithSeed = <T,>(items: T[]) => {
  return [...items].sort(() => Math.random() - 0.5);
};

const rankCreations = (creations: Creation[], userId: string | null, mode: 'popular' | 'trending') => {
  const ranked = creations.map((creation) => {
    const score =
      basePopularityScore(creation, mode) + calculateRecencyBoost(creation.createdAt) + personalBoost(creation, userId);

    return { creation, score };
  });

  ranked.sort((a, b) => b.score - a.score);

  const diversified = ranked.slice(0, 200);
  return shuffleWithSeed(diversified.slice(0, 30))
    .concat(diversified.slice(30))
    .map((item) => item.creation);
};

export interface GeneratePatternInput {
  userId: string;
  prompt: string;
  style: string;
  referenceImage?: string | null;
}

export interface LogInteractionInput {
  userId: string | null;
  creationId: string;
  action: 'view' | 'like' | 'favorite' | 'share' | 'order' | 'comment' | 'remake';
  weight?: number;
  modelUri?: string;
  metadata?: Record<string, unknown>;
}

export interface ForkCreationInput {
  sourceCreationId: string;
  userId: string;
}

export interface ToggleModelVisibilityInput {
  creationId: string;
  modelUri: string;
  isPublic: boolean;
}

export interface DeleteModelInput {
  creationId: string;
  modelUri: string;
}

export interface ToggleLikeInput {
  creationId: string;
  userId: string;
  isLiked: boolean;
}

export interface ToggleFavoriteInput {
  creationId: string;
  userId: string;
  isFavorited: boolean;
}

export interface CommentInput {
  creationId: string;
  commentData: Omit<CommentData, 'createdAt'>;
}

const docToComment = (doc: DocumentSnapshot): Comment => {
  const data = doc.data() as CommentData;
  const createdAt = (data.createdAt as admin.firestore.Timestamp).toDate().toISOString();
  return {
    id: doc.id,
    ...data,
    createdAt,
  };
};

const uploadDataUriToStorage = async (dataUri: string, userId: string): Promise<string> => {
  const bucket = getAdminStorage().bucket();
  const matches = dataUri.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid Data URI format');
  }
  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  const fileName = `creations/${userId}/${uuidv4()}`;
  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: { contentType: mimeType },
  });

  await file.makePublic();
  return file.publicUrl();
};

export const generatePattern = async (input: GeneratePatternInput): Promise<Creation> => {
  const { userId, prompt, style, referenceImage } = input;
  const payload: GenerateTShirtPatternWithStyleInput = {
    prompt,
    style,
    referenceImage: referenceImage ?? undefined,
  };

  const patternResult = await generateTShirtPatternWithStyle(payload);

  const summary = await summarizePrompt({ prompt });

  if (!patternResult.generatedImage) {
    throw new Error('Pattern generation did not return an image');
  }

  const publicUrl = await uploadDataUriToStorage(patternResult.generatedImage, userId);

  const creation: CreationData = {
    userId,
    prompt,
    style,
    summary: summary?.summary,
    patternUri: publicUrl,
    previewPatternUri: patternResult.generatedImage,
    models: [],
    createdAt: nowTimestamp(),
    isPublic: false,
    orderCount: 0,
    likeCount: 0,
    likedBy: [],
    favoriteCount: 0,
    favoritedBy: [],
    commentCount: 0,
    shareCount: 0,
    remakeCount: 0,
  };

  return createCreation(creation);
};

export const generateModel = async (
  input: GenerateModelMockupInput & { creationId: string; userId: string }
): Promise<Creation> => {
  const response = await fetch(input.patternDataUri);
  if (!response.ok) {
    throw new Error('Failed to fetch pattern image from storage');
  }
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get('content-type') ?? 'image/png';
  const fetchedDataUri = `data:${mimeType};base64,${Buffer.from(arrayBuffer).toString('base64')}`;

  const result = await generateModelMockup({
    patternDataUri: fetchedDataUri,
    colorName: input.colorName,
    category: input.category,
  });
  if (!result.modelImageUri) {
    throw new Error('Model generation did not return an image');
  }
  const creation = await findCreationById(input.creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }

  const newModel: Model = {
    uri: await uploadDataUriToStorage(result.modelImageUri, input.userId),
    previewUri: result.modelImageUri,
    category: input.category,
    isPublic: true,
  };

  await getCollectionRef()
    .doc(input.creationId)
    .set({
      models: admin.firestore.FieldValue.arrayUnion(newModel),
    }, { merge: true });

  const updated = await findCreationById(input.creationId);
  if (!updated) {
    throw new Error('Creation not found after adding model');
  }
  return updated;
};

export const getUserCreations = async (userId: string): Promise<Creation[]> => {
  if (!userId) {
    return [];
  }
  return listUserCreations(userId);
};

export const forkCreation = async ({ sourceCreationId, userId }: ForkCreationInput): Promise<Creation> => {
  const creation = await findCreationById(sourceCreationId);
  if (!creation) {
    throw new Error('Source creation not found');
  }

  const cloned: CreationData = {
    userId,
    prompt: creation.prompt,
    style: creation.style,
    summary: creation.summary,
    patternUri: creation.patternUri,
    previewPatternUri: creation.previewPatternUri,
    models: creation.models.map((model) => ({ ...model, isPublic: false })),
    createdAt: nowTimestamp(),
    isPublic: false,
    orderCount: 0,
    likeCount: 0,
    likedBy: [],
    favoriteCount: 0,
    favoritedBy: [],
    commentCount: 0,
    shareCount: 0,
    remakeCount: 0,
  };

  return createCreation(cloned);
};

export const deleteModel = async ({ creationId, modelUri }: DeleteModelInput): Promise<Creation> => {
  const creation = await findCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }

  const modelToDelete = creation.models.find((model) => model.uri === modelUri);
  if (!modelToDelete) {
    throw new Error('Model not found on creation');
  }

  const bucket = getAdminStorage().bucket();
  try {
    const url = new URL(modelToDelete.uri);
    const filePath = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
    if (filePath) {
      await bucket.file(filePath).delete().catch((err) => {
        logger.warn('Failed to delete model from storage', { filePath, error: err.message });
      });
    }
  } catch (error) {
    logger.warn('Invalid URI for deletion, skipping', {
      uri: modelToDelete.uri,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const updatedModels = creation.models.filter((model) => model.uri !== modelUri);
  return updateCreation(creationId, { models: updatedModels } as Partial<CreationData>);
};

export const toggleModelVisibility = async ({ creationId, modelUri, isPublic }: ToggleModelVisibilityInput): Promise<Creation> => {
  const creation = await findCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }

  const updatedModels = creation.models.map((model) =>
    model.uri === modelUri
      ? {
          ...model,
          isPublic,
        }
      : model
  );

  return updateCreation(creationId, { models: updatedModels } as Partial<CreationData>);
};

export const logInteraction = async ({
  action,
  creationId,
  userId,
  weight = 1,
  modelUri,
  metadata,
}: LogInteractionInput): Promise<void> => {
  const creationRef = getCollectionRef().doc(creationId);

  const updates: Record<string, unknown> = {
    [`engagement.${action}`]: admin.firestore.FieldValue.increment(weight),
  };

  if (action === 'like' && userId) {
    updates.likeCount = admin.firestore.FieldValue.increment(weight > 0 ? 1 : -1);
    updates.likedBy = weight > 0 ? admin.firestore.FieldValue.arrayUnion(userId) : admin.firestore.FieldValue.arrayRemove(userId);
  }

  if (action === 'favorite' && userId) {
    updates.favoriteCount = admin.firestore.FieldValue.increment(weight > 0 ? 1 : -1);
    updates.favoritedBy = weight > 0 ? admin.firestore.FieldValue.arrayUnion(userId) : admin.firestore.FieldValue.arrayRemove(userId);
  }

  if (action === 'comment') {
    updates.commentCount = admin.firestore.FieldValue.increment(Math.max(weight, 1));
  }

  if (action === 'share') {
    updates.shareCount = admin.firestore.FieldValue.increment(Math.max(weight, 1));
  }

  if (action === 'remake') {
    updates.remakeCount = admin.firestore.FieldValue.increment(Math.max(weight, 1));
  }

  if (action === 'order') {
    updates.orderCount = admin.firestore.FieldValue.increment(Math.max(weight, 1));
  }

  await creationRef.set(
    {
      ...updates,
      lastInteractionAt: admin.firestore.FieldValue.serverTimestamp(),
      lastInteractionType: action,
      lastInteractionMetadata: {
        ...(metadata ?? {}),
        modelUri: modelUri ?? null,
      },
    },
    { merge: true }
  );
};

export const getPersonalizedFeeds = async (userId: string | null) => {
  const creations = await listPublicCreations();

  if (!creations.length) {
    return {
      popular: [],
      trending: [],
    };
  }

  return {
    popular: rankCreations(creations, userId, 'popular'),
    trending: rankCreations(creations, userId, 'trending'),
  };
};

export const removeCreation = async (creationId: string): Promise<void> => {
  const creation = await findCreationById(creationId);
  if (!creation) {
    return;
  }

  const bucket = getAdminStorage().bucket();
  const fileUris = [creation.patternUri, creation.previewPatternUri, ...creation.models.map((m) => m.uri), ...creation.models.map((m) => m.previewUri)].filter(Boolean) as string[];

  await Promise.all(
    fileUris.map(async (uri) => {
      try {
        const url = new URL(uri);
        const filePath = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
        if (filePath) {
          await bucket.file(filePath).delete().catch((err) => {
            logger.warn('Failed to delete asset', { filePath, error: err.message });
          });
        }
      } catch (error) {
        logger.warn('Invalid storage URI', {
          uri,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })
  );

  await deleteCreationDoc(creationId);
};

export const toggleCreationPublicStatus = async (creationId: string, isPublic: boolean) => {
  return updateCreation(creationId, { isPublic } as Partial<CreationData>);
};

export const getPublicCreations = async (): Promise<Creation[]> => {
  const creations = await listPublicCreations();
  return creations;
};

export const getTrendingCreations = async (): Promise<Creation[]> => {
  const creations = await listPublicCreations();
  return rankCreations(creations, null, 'trending');
};

export const toggleLike = async ({ creationId, userId, isLiked }: ToggleLikeInput) => {
  const creation = await findCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }

  const update = {
    likeCount: admin.firestore.FieldValue.increment(isLiked ? 1 : -1),
    likedBy: isLiked ? admin.firestore.FieldValue.arrayUnion(userId) : admin.firestore.FieldValue.arrayRemove(userId),
  };

  await getCollectionRef().doc(creationId).set(update, { merge: true });
  return { success: true };
};

export const toggleFavorite = async ({ creationId, userId, isFavorited }: ToggleFavoriteInput) => {
  const creation = await findCreationById(creationId);
  if (!creation) {
    throw new Error('Creation not found');
  }

  const update = {
    favoriteCount: admin.firestore.FieldValue.increment(isFavorited ? 1 : -1),
    favoritedBy: isFavorited ? admin.firestore.FieldValue.arrayUnion(userId) : admin.firestore.FieldValue.arrayRemove(userId),
  };

  await getCollectionRef().doc(creationId).set(update, { merge: true });
  return { success: true };
};

export const incrementMetric = async (creationId: string, field: 'shareCount' | 'remakeCount') => {
  await getCollectionRef()
    .doc(creationId)
    .set({ [field]: admin.firestore.FieldValue.increment(1) }, { merge: true });
  return { success: true };
};

export const addComment = async ({ creationId, commentData }: CommentInput): Promise<Comment> => {
  const commentsCollection = getCollectionRef().doc(creationId).collection('comments');
  const newComment: CommentData = {
    ...commentData,
    createdAt: nowTimestamp(),
  };
  const docRef = await commentsCollection.add(newComment);
  const doc = await docRef.get();
  await getCollectionRef()
    .doc(creationId)
    .set({ commentCount: admin.firestore.FieldValue.increment(1) }, { merge: true });
  return docToComment(doc);
};

export const getComments = async (creationId: string): Promise<Comment[]> => {
  const snapshot = await getCollectionRef()
    .doc(creationId)
    .collection('comments')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(docToComment);
};
