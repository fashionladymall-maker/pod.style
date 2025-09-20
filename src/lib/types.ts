import type { User as FirebaseUserType } from "firebase/auth";
import type { Timestamp } from "firebase-admin/firestore";

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

export interface Model {
    uri: string;
    category: string;
}


// This is the object shape that the client-side components will receive.
// Note that 'createdAt' is a string because Timestamp objects are not serializable across server/client boundaries.
export interface Creation {
    id: string;
    userId: string;
    prompt: string;
    style: string;
    summary?: string;
    patternUri: string;
    models: Model[];
    createdAt: string; 
}

// This is the object shape that is stored in Firestore.
// It uses the AdminTimestamp from 'firebase-admin/firestore'.
export interface CreationData {
    userId: string;
    prompt: string;
    style: string;
    summary?: string;
    patternUri: string;
    models: Model[];
    createdAt: Timestamp | { _seconds: number; _nanoseconds: number }; // Allow for raw object from client
}


export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

// Client-side Order type
export interface Order {
    id: string;
    userId: string;
    creationId: string;
    modelUri: string;
    category: string;
    size: string;
    colorName: string;
    quantity: number;
    price: number;
    shippingInfo: ShippingInfo;
    paymentInfo: PaymentInfo;
    createdAt: string; // ISO string
    status: OrderStatus;
}

// Firestore Order data type
export interface OrderData {
    userId: string;
    creationId: string;
    modelUri: string;
    category: string;
    size: string;
    colorName: string;
    quantity: number;
    price: number;
    shippingInfo: ShippingInfo;
    paymentInfo: PaymentInfo;
    createdAt: Timestamp;
    status: OrderStatus;
}
