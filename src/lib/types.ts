import type { User as FirebaseUserType } from "firebase/auth";
import type { Timestamp as AdminTimestamp } from "firebase-admin/firestore";

export interface OrderDetails {
    color: string;
    colorName: string;
    size: string;
    quantity: number;
}

export interface ShippingInfo {
    name: string;
    address: string;
    phone: string;
}

export interface PaymentInfo {
    cardNumber: string;
    expiry: string;
    cvv: string;
}

export type FirebaseUser = FirebaseUserType;

// This is the object shape that the client-side components will receive.
// Note that 'createdAt' is a string because Timestamp objects are not serializable.
export interface Creation {
    id: string;
    userId: string;
    prompt: string;
    style: string;
    category: string;
    patternUri: string;
    modelUri: string | null;
    createdAt: string; 
}

// This is the object shape that is stored in Firestore.
// It uses the AdminTimestamp from 'firebase-admin/firestore'.
export interface CreationData {
    userId: string;
    prompt: string;
    style: string;
    category: string;
    patternUri: string;
    modelUri: string | null;
    createdAt: AdminTimestamp;
}
