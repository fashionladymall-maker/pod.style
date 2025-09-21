
"use server";

import admin from 'firebase-admin';
import { db, storage } from '@/lib/firebase-admin';
import { generateTShirtPatternWithStyle } from '@/ai/flows/generate-t-shirt-pattern-with-style';
import type { GenerateTShirtPatternWithStyleInput } from '@/ai/flows/generate-t-shirt-pattern-with-style';
import { generateModelMockup } from '@/ai/flows/generate-model-mockup';
import type { GenerateModelMockupInput } from '@/ai/flows/generate-model-mockup';
import { summarizePrompt } from '@/ai/flows/summarize-prompt';
import { Creation, CreationData, Model, Order, OrderData, OrderDetails, PaymentInfo, ShippingInfo } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { cache } from 'react';


// --- Firestore Helper Functions ---

const getCreationsCollection = () => db.collection("creations");
const getOrdersCollection = () => db.collection("orders");

const docToCreation = (doc: FirebaseFirestore.DocumentSnapshot): Creation => {
  const data = doc.data() as CreationData;
  // Firestore Timestamps must be converted to a serializable format (ISO string) for the client.
  const createdAt = (data.createdAt as admin.firestore.Timestamp).toDate().toISOString();

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
    const bucket = storage.bucket();

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
    const bucket = storage.bucket();
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

    return newCreation;

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

    const newModel: Model = {
        uri: modelUrl,
        category: category,
    };

    const updatedCreation = await addModelToCreation(creationId, newModel);
    return updatedCreation;

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
        
        // Sort in memory instead of in the query to avoid needing a composite index.
        creations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return creations;

    } catch (error) {
        console.error('Error in getCreationsAction:', error);
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

        // Sort in memory to avoid needing a composite index
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
            .limit(20) // Limit the number of public creations for performance
            .get();
        
        const creations = querySnapshot.docs.map(docToCreation);

        // Sort in memory to avoid needing an index
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
            .limit(20) // Limit results for performance
            .get();

        const creations = querySnapshot.docs.map(docToCreation);

        // Sort in memory to avoid needing an index
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
