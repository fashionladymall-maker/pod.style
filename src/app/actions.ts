
"use server";

import admin from 'firebase-admin';
import { getDb, getAdminStorage } from '@/lib/firebase-admin';
import { generateTShirtPatternWithStyle } from '@/ai/flows/generate-t-shirt-pattern-with-style';
import type { GenerateTShirtPatternWithStyleInput } from '@/ai/flows/generate-t-shirt-pattern-with-style';
import { generateModelMockup } from '@/ai/flows/generate-model-mockup';
import type { GenerateModelMockupInput } from '@/ai/flows/generate-model-mockup';
import { summarizePrompt } from '@/ai/flows/summarize-prompt';
import { Creation, CreationData, Model, Order, OrderData, OrderDetails, PaymentInfo, ShippingInfo, Comment, CommentData } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { cache } from 'react';

const getFirestoreDb = () => getDb();

const hasErrorCode = (error: unknown): error is { code: string } =>
  typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: unknown }).code === 'string';


// --- Firestore Helper Functions ---

const getCreationsCollection = () => getDb().collection("creations");
const getOrdersCollection = () => getDb().collection("orders");
const getCommentsCollection = (creationId: string) => getCreationsCollection().doc(creationId).collection("comments");

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
    const score = basePopularityScore(creation, mode)
      + calculateRecencyBoost(creation.createdAt)
      + personalBoost(creation, userId);

    return { creation, score };
  });

  ranked.sort((a, b) => b.score - a.score);

  const diversified = ranked.slice(0, 200); // soft cap for performance
  return shuffleWithSeed(diversified.slice(0, 30)).concat(diversified.slice(30)).map(item => item.creation);
};

interface CachedModel {
  uri: string;
  category: string;
  isPublic?: boolean;
  previewUri?: string | null;
}

interface CachedCreation extends Omit<Creation, 'summary' | 'previewPatternUri' | 'models'> {
  summary?: string | null;
  previewPatternUri?: string | null;
  models?: CachedModel[];
}

const serializeCreationForCache = (creation: Creation): CachedCreation => ({
  ...creation,
  summary: creation.summary ?? null,
  previewPatternUri: creation.previewPatternUri ?? null,
  models: (creation.models || []).map((model) => ({
    ...model,
    isPublic: model.isPublic ?? true,
    previewUri: model.previewUri ?? null,
  })),
});

const deserializeCreationFromCache = (creation: CachedCreation): Creation => ({
  ...creation,
  summary: creation.summary ?? undefined,
  previewPatternUri: creation.previewPatternUri ?? undefined,
  models: (creation.models ?? []).map((model) => ({
    ...model,
    isPublic: model.isPublic ?? true,
    previewUri: model.previewUri ?? undefined,
  })),
});

const enqueueStorageCleanup = async (items: { path: string; reason: string; metadata?: Record<string, unknown> }[]) => {
  if (!items.length) return;
  const db = getFirestoreDb();
  const batch = db.batch();
  const queueRef = db.collection('storage_cleanup_queue');
  items.forEach(item => {
    const docRef = queueRef.doc();
    batch.set(docRef, {
      path: item.path,
      reason: item.reason,
      metadata: item.metadata ?? {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    });
  });
  await batch.commit();
};

const extractGcsPath = (urlString: string | undefined | null) => {
  if (!urlString) return null;
  try {
    const url = new URL(urlString);
    const path = url.pathname.split('/').slice(2).join('/');
    return path || null;
  } catch (error) {
    console.warn('Failed to parse storage url for cleanup:', urlString, error);
    return null;
  }
};

const docToCreation = (doc: FirebaseFirestore.DocumentSnapshot): Creation => {
  const data = doc.data() as CreationData;
  const createdAt = (data.createdAt as admin.firestore.Timestamp)?.toDate().toISOString();

  return {
    id: doc.id,
    userId: data.userId,
    prompt: data.prompt,
    style: data.style,
    summary: data.summary,
    patternUri: data.patternUri,
    models: data.models || [],
    createdAt: createdAt,
    isPublic: data.isPublic || false,
    orderCount: data.orderCount || 0,
    likeCount: data.likeCount || 0,
    likedBy: data.likedBy || [],
    favoriteCount: data.favoriteCount || 0,
    favoritedBy: data.favoritedBy || [],
    commentCount: data.commentCount || 0,
    shareCount: data.shareCount || 0,
    remakeCount: data.remakeCount || 0,
  };
};

const docToOrder = (doc: FirebaseFirestore.DocumentSnapshot): Order => {
  const data = doc.data() as OrderData;
  const createdAt = (data.createdAt as admin.firestore.Timestamp).toDate().toISOString();

  return {
      id: doc.id,
      userId: data.userId,
      creationId: data.creationId,
      modelUri: data.modelUri,
      category: data.category,
      size: data.size,
      colorName: data.colorName,
      quantity: data.quantity,
      price: data.price,
      shippingInfo: data.shippingInfo,
      paymentInfo: data.paymentInfo,
      createdAt: createdAt,
      status: data.status,
  };
};

const docToComment = (doc: FirebaseFirestore.DocumentSnapshot): Comment => {
    const data = doc.data() as CommentData;
    const createdAt = (data.createdAt as admin.firestore.Timestamp).toDate().toISOString();
    return {
        id: doc.id,
        ...data,
        createdAt,
    };
};


interface AddCreationData {
    userId: string;
    prompt: string;
    style: string;
    summary?: string;
    patternUri: string;
}

const addCreation = async (data: AddCreationData): Promise<Creation> => {
  const creationData: CreationData = {
    ...data,
    models: [],
    createdAt: admin.firestore.Timestamp.now(),
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
  const docRef = await getCreationsCollection().add(creationData);
  const newDoc = await docRef.get();
  return docToCreation(newDoc);
};

const addModelToCreation = async (creationId: string, newModel: Model): Promise<Creation> => {
  const creationRef = getCreationsCollection().doc(creationId);
  
  await creationRef.update({
    models: admin.firestore.FieldValue.arrayUnion(newModel)
  });
  
  const updatedDoc = await creationRef.get();
  if (!updatedDoc.exists) {
    throw new Error("Creation not found after adding model.");
  }
  return docToCreation(updatedDoc);
};

const deleteCreation = async (creationId: string): Promise<void> => {
    const creationRef = getCreationsCollection().doc(creationId);
    const doc = await creationRef.get();
    if (!doc.exists) return;

    const creation = docToCreation(doc);
    const bucket = getAdminStorage().bucket();

    const fileUris = [creation.patternUri, ...creation.models.map(m => m.uri)];

    const deletePromises = fileUris.map(uri => {
        if (!uri) return Promise.resolve();
        try {
            const url = new URL(uri);
            const filePath = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
            if (filePath) {
                console.log(`Attempting to delete: ${filePath}`);
                return bucket.file(filePath).delete().catch(err => {
                    console.warn(`Failed to delete ${filePath}:`, err.message);
                });
            }
        } catch (e) {
            console.warn(`Invalid URI for deletion, skipping: ${uri}`, e);
        }
        return Promise.resolve();
    });

    await Promise.all(deletePromises);
    await creationRef.delete();
    console.log(`Creation ${creationId} and associated files deleted.`);
};



// --- Server Actions ---

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


interface GeneratePatternActionInput extends Omit<GenerateTShirtPatternWithStyleInput, 'category'> {
  userId: string;
}

export async function generatePatternAction(input: GeneratePatternActionInput): Promise<Creation> {
  const { userId, prompt, inspirationImage, style } = input;
  try {
    const [patternResult, summaryResult] = await Promise.all([
        generateTShirtPatternWithStyle({
            prompt,
            inspirationImage,
            style,
        }),
        summarizePrompt({ prompt })
    ]);

    if (!patternResult.generatedImage) {
        throw new Error('The AI failed to return an image. This might be due to a safety policy violation.');
    }
    
    const publicUrl = await uploadDataUriToStorage(patternResult.generatedImage, userId);

    const newCreation = await addCreation({
        userId,
        prompt,
        style: style || 'None',
        patternUri: publicUrl,
        summary: summaryResult.summary,
    });

    return {
      ...newCreation,
      previewPatternUri: patternResult.generatedImage,
    };

  } catch (error) {
    console.error('Error in generatePatternAction:', error);
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

interface GenerateModelActionInput extends GenerateModelMockupInput {
    creationId: string;
    userId: string;
}

export async function generateModelAction(input: GenerateModelActionInput): Promise<Creation> {
  const { creationId, userId, patternDataUri, colorName, category } = input;
  try {
    const response = await fetch(patternDataUri);
    if (!response.ok) throw new Error('Failed to fetch pattern image from storage.');
    const imageBuffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const imageMimeType = response.headers.get('content-type') || 'image/png';
    const fetchedDataUri = `data:${imageMimeType};base64,${imageBase64}`;
    
    const result = await generateModelMockup({
        patternDataUri: fetchedDataUri,
        colorName,
        category
    });
    if (!result.modelImageUri) {
        throw new Error('The AI failed to return a model image.');
    }
    
    const modelUrl = await uploadDataUriToStorage(result.modelImageUri, userId);

    const newModelForFirestore: Model = {
        uri: modelUrl,
        category: category,
        isPublic: true,
    };

    const updatedCreation = await addModelToCreation(creationId, newModelForFirestore);

    const enhancedModels = updatedCreation.models.map((model, index) =>
      index === updatedCreation.models.length - 1 && model.uri === modelUrl
        ? { ...model, previewUri: result.modelImageUri }
        : model
    );

    return {
      ...updatedCreation,
      models: enhancedModels,
    };

  } catch (error) {
    console.error('Error in generateModelAction:', error);
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}


export async function getCreationsAction(userId: string): Promise<Creation[]> {
    if (!userId) {
        return []; 
    }
    try {
        const querySnapshot = await getCreationsCollection()
            .where("userId", "==", userId)
            .get();
        
        const creations = querySnapshot.docs.map(docToCreation);
        
        creations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return creations;

    } catch (error) {
        console.error('Error in getCreationsAction:', error);
        if (error instanceof Error) throw error;
        throw new Error(String(error));
  }
}

interface ForkCreationInput {
  sourceCreationId: string;
  userId: string;
}

export async function forkCreationAction({ sourceCreationId, userId }: ForkCreationInput): Promise<Creation> {
  const sourceDoc = await getCreationsCollection().doc(sourceCreationId).get();
  if (!sourceDoc.exists) {
    throw new Error('原始作品不存在或已被删除。');
  }

  const sourceData = docToCreation(sourceDoc);

  const clonedCreation = await addCreation({
    userId,
    prompt: sourceData.prompt,
    style: sourceData.style,
    summary: sourceData.summary,
    patternUri: sourceData.patternUri,
  });

  console.log(`Creation ${sourceCreationId} forked to new creation ${clonedCreation.id} for user ${userId}.`);

  return clonedCreation;
}

interface DeleteCreationModelInput {
  creationId: string;
  modelUri: string;
}

export async function deleteCreationModelAction({ creationId, modelUri }: DeleteCreationModelInput): Promise<Creation> {
  const creationRef = getCreationsCollection().doc(creationId);
  const doc = await creationRef.get();

  if (!doc.exists) {
    throw new Error('要删除的作品不存在。');
  }

  const data = doc.data() as CreationData;
  const existingModels = data.models || [];
  const filteredModels = existingModels.filter(model => model.uri !== modelUri);

  if (filteredModels.length === existingModels.length) {
    throw new Error('未找到要删除的商品效果图。');
  }

  try {
    const bucket = getAdminStorage().bucket();
    const url = new URL(modelUri);
    const filePath = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
    if (filePath) {
      await bucket.file(filePath).delete().catch(err => {
        console.warn(`删除模型图 ${filePath} 失败:`, err.message);
      });
    }
  } catch (error) {
    console.warn('解析模型图路径失败，跳过存储删除。', error);
  }

  await creationRef.update({ models: filteredModels });

  const updatedDoc = await creationRef.get();
  return docToCreation(updatedDoc);
}

interface ToggleCreationModelVisibilityInput {
  creationId: string;
  modelUri: string;
  isPublic: boolean;
}

export async function toggleCreationModelVisibilityAction({ creationId, modelUri, isPublic }: ToggleCreationModelVisibilityInput): Promise<Creation> {
  const creationRef = getCreationsCollection().doc(creationId);
  const doc = await creationRef.get();

  if (!doc.exists) {
    throw new Error('要更新的作品不存在。');
  }

  const data = doc.data() as CreationData;
  const existingModels = data.models || [];
  const targetIndex = existingModels.findIndex(model => model.uri === modelUri);

  if (targetIndex === -1) {
    throw new Error('未找到要更新的商品效果图。');
  }

  existingModels[targetIndex] = {
    ...existingModels[targetIndex],
    isPublic,
  } as Model;

  await creationRef.update({ models: existingModels });

  if (!isPublic) {
    const path = extractGcsPath(modelUri);
    if (path) {
      await enqueueStorageCleanup([
        {
          path,
          reason: 'model-private',
          metadata: { creationId, modelUri },
        },
      ]);
    }
  }

  const updatedDoc = await creationRef.get();
  return docToCreation(updatedDoc);
}

interface LogInteractionInput {
  userId: string;
  creationId: string;
  action: string;
  weight?: number;
  modelUri?: string;
  metadata?: Record<string, unknown>;
}

export async function logCreationInteractionAction({ userId, creationId, action, weight, modelUri, metadata }: LogInteractionInput): Promise<void> {
  try {
    const db = getFirestoreDb();
    await db.collection('creation_interactions').add({
      userId,
      creationId,
      action,
      weight: weight ?? 1,
      modelUri: modelUri ?? null,
      metadata: metadata ?? {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log creation interaction:', error);
  }
}

export async function getPersonalizedFeedsAction(userId: string | null): Promise<{ popular: Creation[]; trending: Creation[] }> {
  try {
    const db = getFirestoreDb();
    const cacheId = userId ?? 'public';
    const CACHE_TTL_MS = 10 * 60 * 1000;

    const cacheDoc = await db.collection('personalized_feed_cache').doc(cacheId).get();
    if (cacheDoc.exists) {
      const data = cacheDoc.data();
      if (data) {
        const updatedAt: admin.firestore.Timestamp | undefined = data.updatedAt;
        const updatedTime = updatedAt?.toDate().getTime();
        if (updatedTime && Date.now() - updatedTime < CACHE_TTL_MS) {
          return {
            popular: (data.popular ?? []).map(deserializeCreationFromCache),
            trending: (data.trending ?? []).map(deserializeCreationFromCache),
          };
        }
      }
    }

    const snapshot = await getCreationsCollection()
      .where('isPublic', '==', true)
      .get();

    const creations = snapshot.docs.map(docToCreation);

    const popular = rankCreations(creations, userId, 'popular');
    const trending = rankCreations(creations, userId, 'trending');

    await db.collection('personalized_feed_cache').doc(cacheId).set({
      popular: popular.map(serializeCreationForCache),
      trending: trending.map(serializeCreationForCache),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return { popular, trending };
  } catch (error) {
    console.error('Failed to build personalized feeds:', error);
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

export async function deleteCreationAction(creationId: string): Promise<{ success: boolean }> {
    try {
        await deleteCreation(creationId);
        return { success: true };
    } catch (error) {
        console.error('Error in deleteCreationAction:', error);
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}


// --- Order Actions ----

interface CreateOrderActionInput {
    userId: string;
    creationId: string;
    model: Model;
    orderDetails: OrderDetails;
    shippingInfo: ShippingInfo;
    paymentInfo: PaymentInfo;
    price: number;
}

export async function createOrderAction(input: CreateOrderActionInput): Promise<Order> {
    const { userId, creationId, model, orderDetails, shippingInfo, paymentInfo, price } = input;
    const creationRef = getCreationsCollection().doc(creationId);
    const orderRef = getOrdersCollection().doc();
    const db = getFirestoreDb();
    
    const timestamp = admin.firestore.Timestamp.now();

    try {
        const orderData: OrderData = {
            userId,
            creationId,
            modelUri: model.uri,
            category: model.category,
            size: orderDetails.size,
            colorName: orderDetails.colorName,
            quantity: orderDetails.quantity,
            price: price * orderDetails.quantity,
            shippingInfo,
            paymentInfo,
            status: 'Processing',
            createdAt: timestamp,
        };

        await db.runTransaction(async (transaction) => {
            transaction.update(creationRef, { 
                orderCount: admin.firestore.FieldValue.increment(1) 
            });
            transaction.set(orderRef, orderData);
        });

        return {
            id: orderRef.id,
            ...orderData,
            createdAt: timestamp.toDate().toISOString(),
        };

    } catch (error) {
        console.error('Error in createOrderAction transaction:', error);
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}

export async function getOrdersAction(userId: string): Promise<Order[]> {
    if (!userId) {
        return [];
    }
    try {
        const querySnapshot = await getOrdersCollection()
            .where("userId", "==", userId)
            .get();
        
        const orders = querySnapshot.docs.map(docToOrder);

        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return orders;

    } catch (error) {
        console.error('Error in getOrdersAction:', error);
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}


// --- Data Migration Action ---

export async function migrateAnonymousDataAction(anonymousUid: string, permanentUid: string): Promise<{ success: boolean }> {
  if (!anonymousUid || !permanentUid || anonymousUid === permanentUid) {
    console.warn(`Migration skipped: Invalid UIDs. anonymousUid: ${anonymousUid}, permanentUid: ${permanentUid}`);
    return { success: false };
  }

  console.log(`Starting data migration from anonymous user ${anonymousUid} to permanent user ${permanentUid}`);

  try {
    const creationsSnapshot = await getCreationsCollection().where('userId', '==', anonymousUid).get();
    const ordersSnapshot = await getOrdersCollection().where('userId', '==', anonymousUid).get();

    if (creationsSnapshot.empty && ordersSnapshot.empty) {
        console.log("No data to migrate.");
        return { success: true };
    }
    
    const db = getFirestoreDb();
    const batch = db.batch();

    creationsSnapshot.docs.forEach(doc => {
      console.log(`Migrating creation: ${doc.id}`);
      batch.update(doc.ref, { userId: permanentUid });
    });

    ordersSnapshot.docs.forEach(doc => {
      console.log(`Migrating order: ${doc.id}`);
      batch.update(doc.ref, { userId: permanentUid });
    });

    await batch.commit();
    console.log(`Data migration completed successfully for user ${permanentUid}.`);
    return { success: true };
  } catch (error) {
    console.error(`Error during data migration from ${anonymousUid} to ${permanentUid}:`, error);
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

export async function toggleCreationPublicStatusAction(creationId: string, isPublic: boolean): Promise<{ success: boolean }> {
    try {
        const creationRef = getCreationsCollection().doc(creationId);
        await creationRef.update({ isPublic: isPublic });

        if (!isPublic) {
            const snapshot = await creationRef.get();
            if (snapshot.exists) {
                const data = snapshot.data() as CreationData;
                const paths = [extractGcsPath(data.patternUri), ...(data.models || []).map(model => extractGcsPath(model.uri))]
                    .filter((path): path is string => Boolean(path));
                await enqueueStorageCleanup(paths.map(path => ({
                    path,
                    reason: 'creation-private',
                    metadata: { creationId },
                })));
            }
        }
        return { success: true };
    } catch (error) {
        console.error('Error in toggleCreationPublicStatusAction:', error);
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}

export const getPublicCreationsAction = cache(async (): Promise<Creation[]> => {
    try {
        const querySnapshot = await getCreationsCollection()
            .where("isPublic", "==", true)
            .get();
        
        const creations = querySnapshot.docs.map(docToCreation);

        creations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return creations;

    } catch (error) {
        console.error('Error in getPublicCreationsAction:', error);
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
});


export const getTrendingCreationsAction = cache(async (): Promise<Creation[]> => {
    try {
        const querySnapshot = await getCreationsCollection()
            .where("isPublic", "==", true)
            .get();

        const creations = querySnapshot.docs.map(docToCreation);

        creations.sort((a, b) => {
            if (b.orderCount !== a.orderCount) {
                return b.orderCount - a.orderCount;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return creations;

    } catch (error) {
        console.error('Error in getTrendingCreationsAction:', error);
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
});


// --- Social Actions ---

export async function toggleLikeAction(creationId: string, userId: string, isLiked: boolean): Promise<{ success: boolean }> {
    const creationRef = getCreationsCollection().doc(creationId);
    try {
        if (isLiked) {
            await creationRef.update({
                likeCount: admin.firestore.FieldValue.increment(-1),
                likedBy: admin.firestore.FieldValue.arrayRemove(userId)
            });
        } else {
            await creationRef.update({
                likeCount: admin.firestore.FieldValue.increment(1),
                likedBy: admin.firestore.FieldValue.arrayUnion(userId)
            });
        }
        return { success: true };
    } catch (error) {
        console.error('Error in toggleLikeAction:', error);
        return { success: false };
    }
}

export async function toggleFavoriteAction(creationId: string, userId: string, isFavorited: boolean): Promise<{ success: boolean }> {
    const creationRef = getCreationsCollection().doc(creationId);
    try {
        if (isFavorited) {
            await creationRef.update({
                favoriteCount: admin.firestore.FieldValue.increment(-1),
                favoritedBy: admin.firestore.FieldValue.arrayRemove(userId)
            });
        } else {
            await creationRef.update({
                favoriteCount: admin.firestore.FieldValue.increment(1),
                favoritedBy: admin.firestore.FieldValue.arrayUnion(userId)
            });
        }
        return { success: true };
    } catch (error) {
        console.error('Error in toggleFavoriteAction:', error);
        return { success: false };
    }
}

export async function addCommentAction(creationId: string, commentData: Omit<CommentData, 'createdAt'>): Promise<Comment> {
    const creationRef = getCreationsCollection().doc(creationId);
    const commentsRef = getCommentsCollection(creationId);
    const newCommentRef = commentsRef.doc();
    const db = getFirestoreDb();

    const dataWithTimestamp: CommentData = {
        ...commentData,
        createdAt: admin.firestore.Timestamp.now()
    };

    try {
        await db.runTransaction(async (transaction) => {
            transaction.set(newCommentRef, dataWithTimestamp);
            transaction.update(creationRef, {
                commentCount: admin.firestore.FieldValue.increment(1)
            });
        });
        const newCommentDoc = await newCommentRef.get();
        return docToComment(newCommentDoc);
    } catch (error) {
        console.error('Error in addCommentAction:', error);
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}

export async function getCommentsAction(creationId: string): Promise<Comment[]> {
    try {
        const snapshot = await getCommentsCollection(creationId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        return snapshot.docs.map(docToComment);
    } catch (error) {
        console.error('Error in getCommentsAction:', error);
        // Firestore will throw if the index doesn't exist. This is a common setup step.
        if (hasErrorCode(error) && error.code === 'FAILED_PRECONDITION') {
            console.error(`This query requires a Firestore index. Please create a composite index on the 'comments' subcollection with fields: 'createdAt' (descending).`);
        }
        return [];
    }
}


export async function incrementShareCountAction(creationId: string): Promise<{ success: boolean }> {
    const creationRef = getCreationsCollection().doc(creationId);
    try {
        await creationRef.update({
            shareCount: admin.firestore.FieldValue.increment(1)
        });
        return { success: true };
    } catch (error) {
        console.error('Error in incrementShareCountAction:', error);
        return { success: false };
    }
}

export async function incrementRemakeCountAction(creationId: string): Promise<{ success: boolean }> {
    const creationRef = getCreationsCollection().doc(creationId);
    try {
        await creationRef.update({
            remakeCount: admin.firestore.FieldValue.increment(1)
        });
        return { success: true };
    } catch (error) {
        console.error('Error in incrementRemakeCountAction:', error);
        return { success: false };
    }
}
