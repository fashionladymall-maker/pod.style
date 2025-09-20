import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { app } from "./firebase";
import { Creation, CreationData } from "./types";

const db = getFirestore(app);
const creationsCollection = collection(db, "creations");

// Helper to convert Firestore doc to Creation object
const docToCreation = (doc: any): Creation => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt.toDate().toISOString(),
  } as Creation;
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
  const docRef = await addDoc(creationsCollection, creationData);
  const newDoc = await getDoc(docRef);
  return docToCreation(newDoc);
};

// Get all creations for a user
export const getCreations = async (userId: string): Promise<Creation[]> => {
  const q = query(creationsCollection, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => docToCreation(doc));
};

// Update a creation with a model URI
export const updateCreationModel = async (creationId: string, modelUri: string): Promise<Creation> => {
  const creationRef = doc(db, "creations", creationId);
  await updateDoc(creationRef, {
    modelUri: modelUri,
  });
  const updatedDoc = await getDoc(creationRef);
  if (!updatedDoc.exists()) {
    throw new Error("Creation not found after update.");
  }
  return docToCreation(updatedDoc);
};

// Delete a creation
export const deleteCreation = async (creationId: string): Promise<void> => {
  const creationRef = doc(db, "creations", creationId);
  await deleteDoc(creationRef);
};
