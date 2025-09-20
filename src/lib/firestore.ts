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
import { Creation } from "./types";

const db = getFirestore(app);
const creationsCollection = collection(db, "creations");

interface AddCreationData {
    userId: string;
    prompt: string;
    style: string;
    category: string;
    patternUri: string;
}

// Add a new creation
export const addCreation = async (data: AddCreationData): Promise<Creation> => {
  const creationData = {
    ...data,
    modelUri: null,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(creationsCollection, creationData);
  return {
    id: docRef.id,
    ...creationData
  } as Creation;
};

// Get all creations for a user
export const getCreations = async (userId: string): Promise<Creation[]> => {
  const q = query(creationsCollection, where("userId", "==", userId), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creation));
};

// Update a creation with a model URI
export const updateCreationModel = async (creationId: string, modelUri: string): Promise<Creation> => {
  const creationRef = doc(db, "creations", creationId);
  await updateDoc(creationRef, {
    modelUri: modelUri,
  });
  const updatedDoc = await getDoc(creationRef);
  return { id: updatedDoc.id, ...updatedDoc.data() } as Creation;
};

// Delete a creation
export const deleteCreation = async (creationId: string): Promise<void> => {
  const creationRef = doc(db, "creations", creationId);
  await deleteDoc(creationRef);
};
