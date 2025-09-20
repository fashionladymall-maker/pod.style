
"use server";

import admin from 'firebase-admin';
import { db, storage } from '@/lib/firebase-admin';
import { generateTShirtPatternWithStyle } from '@/ai/flows/generate-t-shirt-pattern-with-style';
import type { GenerateTShirtPatternWithStyleInput } from '@/ai/flows/generate-t-shirt-pattern-with-style';
import { generateModelMockup } from '@/ai/flows/generate-model-mockup';
import type { GenerateModelMockupInput } from '@/ai/flows/generate-model-mockup';
import { Creation, CreationData } from '@/lib/types';
import type { Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';


// --- Firestore Helper Functions ---

const getCreationsCollection = () => db.collection("creations");

const docToCreation = (doc: FirebaseFirestore.DocumentSnapshot): Creation => {
  const data = doc.data() as CreationData;
  return {
    id: doc.id,
    userId: data.userId,
    prompt: data.prompt,
    style: data.style,
    category: data.category,
    patternUri: data.patternUri,
    modelUri: data.modelUri || null,
    // The toDate() method is available on the admin Timestamp object
    createdAt: data.createdAt.toDate().toISOString(), 
  };
};

interface AddCreationData {
    userId: string;
    prompt: string;
    style: string;
    category: string;
    patternUri: string;
}

const addCreation = async (data: AddCreationData): Promise<Creation> => {
  const creationData: CreationData = {
    ...data,
    modelUri: null,
    createdAt: admin.firestore.Timestamp.now(),
  };
  const docRef = await db.collection("creations").add(creationData);
  const newDoc = await docRef.get();
  return docToCreation(newDoc);
};

const getCreations = async (userId: string): Promise<Creation[]> => {
  const querySnapshot = await getCreationsCollection()
    .where("userId", "==", userId)
    .get();
  
  if (querySnapshot.empty) {
    return [];
  }

  const creations = querySnapshot.docs.map(docToCreation);

  // Sort the creations in memory instead.
  creations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return creations;
};

const updateCreationModel = async (creationId: string, modelUri: string, category: string): Promise<Creation> => {
  const creationRef = getCreationsCollection().doc(creationId);
  
  const docSnap = await creationRef.get();
  if (!docSnap.exists) {
    throw new Error("Creation not found. Cannot update model.");
  }

  await creationRef.update({ modelUri, category });
  
  const updatedDoc = await creationRef.get();
  return docToCreation(updatedDoc);
};

const deleteCreation = async (creationId: string): Promise<void> => {
  const creationRef = getCreationsCollection().doc(creationId);
  await creationRef.delete();
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
    
    return file.publicUrl();
};


interface GeneratePatternActionInput extends GenerateTShirtPatternWithStyleInput {
  userId: string;
  category: string;
}

export async function generatePatternAction(input: GeneratePatternActionInput): Promise<Creation> {
  const { userId, prompt, inspirationImage, style, category } = input;
  try {
    const result = await generateTShirtPatternWithStyle({
        prompt,
        inspirationImage,
        style,
    });
    if (!result.generatedImage) {
        throw new Error('The AI failed to return an image. This might be due to a safety policy violation.');
    }
    
    const publicUrl = await uploadDataUriToStorage(result.generatedImage, userId);

    const newCreation = await addCreation({
        userId,
        prompt,
        style: style || 'None',
        category,
        patternUri: publicUrl,
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

    const updatedCreation = await updateCreationModel(creationId, modelUrl, category);
    return updatedCreation;

  } catch (error) {
    console.error('Error in generateModelAction:', error);
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}


export async function getCreationsAction(userId: string): Promise<Creation[]> {
    try {
        const creations = await getCreations(userId);
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
