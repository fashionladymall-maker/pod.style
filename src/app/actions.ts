
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


// --- Firestore Helper Functions ---

const getCreationsCollection = () => db.collection("creations");
const getOrdersCollection = () => db.collection("orders");

const docToCreation = (doc: FirebaseFirestore.DocumentSnapshot): Creation => {
  const data = doc.data() as CreationData;
  // Firestore Timestamps need to be converted to a serializable format (ISO string)
  const createdAt = data.createdAt instanceof admin.firestore.Timestamp 
    ? data.createdAt.toDate().toISOString() 
    : new Date((data.createdAt as any)._seconds * 1000).toISOString();

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
  const docRef = await db.collection("creations").add(creationData);
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

    // Collect all file URIs to be deleted from both patternUri and models array
    const fileUris = [creation.patternUri, ...creation.models.map(m => m.uri)];

    const deletePromises = fileUris.map(uri => {
        if (!uri) return Promise.resolve();
        try {
            // Extract file path from the public URL
            // e.g., https://storage.googleapis.com/your-bucket-name/creations/user-id/uuid
            const url = new URL(uri);
            // Pathname is /bucket-name/file/path, so we split and slice
            const filePath = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
            if (filePath) {
                console.log(`Attempting to delete: ${filePath}`);
                return bucket.file(filePath).delete().catch(err => {
                    // It's possible the file doesn't exist or permissions are wrong
                    // We'll log a warning but not fail the whole operation
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
    
    // Make the file public and return the public URL
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
        
        if (querySnapshot.empty) {
            return [];
        }

        const creations = querySnapshot.docs.map(docToCreation);
        
        // Sort in-memory after fetching
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
            createdAt: admin.firestore.Timestamp.now(),
        };

        // Use a transaction to ensure both operations succeed or fail together
        const newOrder = await db.runTransaction(async (transaction) => {
            // 1. Increment the order count on the creation
            transaction.update(creationRef, { 
                orderCount: admin.firestore.FieldValue.increment(1) 
            });

            // 2. Add the new order document
            const orderRef = getOrdersCollection().doc();
            transaction.set(orderRef, orderData);
            
            // Return the created order (or at least its ID) to be fetched outside
            return docToOrder((await transaction.get(orderRef)));
        });

        return newOrder;

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
        
        if (querySnapshot.empty) {
            return [];
        }

        const orders = querySnapshot.docs.map(docToOrder);
        
        // Sort in-memory after fetching
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
    const batch = db.batch();

    // Migrate creations
    const creationsSnapshot = await getCreationsCollection().where('userId', '==', anonymousUid).get();
    if (!creationsSnapshot.empty) {
      creationsSnapshot.docs.forEach(doc => {
        console.log(`Migrating creation: ${doc.id}`);
        batch.update(doc.ref, { userId: permanentUid });
      });
    }

    // Migrate orders
    const ordersSnapshot = await getOrdersCollection().where('userId', '==', anonymousUid).get();
    if (!ordersSnapshot.empty) {
      ordersSnapshot.docs.forEach(doc => {
        console.log(`Migrating order: ${doc.id}`);
        batch.update(doc.ref, { userId: permanentUid });
      });
    }

    await batch.commit();
    console.log(`Data migration completed successfully for user ${permanentUid}.`);
    return { success: true };
  } catch (error) {
    console.error(`Error during data migration from ${anonymousUid} to ${permanentUid}:`, error);
    // In case of error, we don't want to leave data in a partially migrated state.
    // The batch commit is atomic, so it either all succeeds or all fails.
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

export async function getPublicCreationsAction(): Promise<Creation[]> {
    try {
        const querySnapshot = await getCreationsCollection()
            .where("isPublic", "==", true)
            .get();
        
        if (querySnapshot.empty) {
            return [];
        }

        const creations = querySnapshot.docs.map(docToCreation);

        // Sort in-memory after fetching to avoid needing a composite index
        creations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return creations;

    } catch (error) {
        console.error('Error in getPublicCreationsAction:', error);
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}


export async function getTrendingCreationsAction(): Promise<Creation[]> {
    try {
        const querySnapshot = await getCreationsCollection()
            .where("isPublic", "==", true)
            .orderBy("orderCount", "desc")
            .limit(20) // Let's limit to top 20 for performance
            .get();
        
        if (querySnapshot.empty) {
            return [];
        }

        return querySnapshot.docs.map(docToCreation);

    } catch (error) {
        console.error('Error in getTrendingCreationsAction:', error);
        // This query requires a composite index on (isPublic, orderCount)
        // If it fails, provide a helpful message.
        if (error instanceof Error && (error as any).code === 'FAILED_PRECONDITION') {
            const errorMessage = `The 'getTrendingCreationsAction' query requires a composite index. Please create one in your Firebase console for the 'creations' collection on the fields 'isPublic' (ascending) and 'orderCount' (descending). The error includes a direct link to create it.`;
            console.error(errorMessage);
            // Re-throw a more user-friendly error to be caught by the client
            throw new Error(errorMessage);
        }
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}
