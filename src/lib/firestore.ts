
import { db } from './firebase-admin';
import type { Creation, CreationData } from "./types";
import { Timestamp } from 'firebase-admin/firestore';

const creationsCollection = db.collection("creations");

// Helper to convert Firestore doc from firebase-admin to Creation object
const docToCreation = (doc: FirebaseFirestore.DocumentSnapshot): Creation => {
  const data = doc.data() as CreationData;
  return {
    id: doc.id,
    ...data,
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

// Add a new creation
export const addCreation = async (data: AddCreationData): Promise<Creation> => {
  const creationData: Omit<CreationData, 'id'> = {
    ...data,
    modelUri: null,
    createdAt: Timestamp.now(),
  };
  const docRef = await creationsCollection.add(creationData);
  const newDoc = await docRef.get();
  return docToCreation(newDoc);
};

// Get all creations for a user
export const getCreations = async (userId: string): Promise<Creation[]> => {
  const q = creationsCollection.where("userId", "==", userId);
  const querySnapshot = await q.get();
  const creations = querySnapshot.docs.map(doc => docToCreation(doc));
  
  // Sort by date descending in code
  return creations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Update a creation with a model URI
export const updateCreationModel = async (creationId: string, modelUri: string): Promise<Creation> => {
  const creationRef = creationsCollection.doc(creationId);
  
  const docSnap = await creationRef.get();
  if (!docSnap.exists) {
    throw new Error("Creation not found. Cannot update model.");
  }

  await creationRef.update({
    modelUri: modelUri,
  });
  
  const updatedDoc = await creationRef.get();
  return docToCreation(updatedDoc);
};

// Delete a creation
export const deleteCreation = async (creationId: string): Promise<void> => {
  const creationRef = creationsCollection.doc(creationId);
  await creationRef.delete();
};
