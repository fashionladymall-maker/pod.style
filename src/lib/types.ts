
import type { User as FirebaseUserType, AuthCredential } from "firebase/auth";
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
    email?: string; // Add email for guest checkout
}

export interface PaymentSummary {
    tokenId: string;
    brand: string;
    last4: string;
    gateway: 'stripe' | 'paypal' | 'mock';
    status: 'requires_action' | 'pending' | 'succeeded' | 'failed';
}

export type FirebaseUser = FirebaseUserType;
export type { AuthCredential };

export interface Model {
    uri: string;
    category: string;
    isPublic?: boolean;
    previewUri?: string;
}


export type UserFineTunedModelStatus = 'training' | 'ready' | 'failed';
export type UserFineTunedModelProvider = 'googleai' | 'openai' | 'custom';

export interface UserFineTunedModelPersonalization {
    strength: number;
    tags: string[];
    preferredStyles?: string[];
}

export interface UserFineTunedModel {
    userId: string;
    modelName: string;
    displayName: string;
    provider: UserFineTunedModelProvider;
    baseModel: string;
    status: UserFineTunedModelStatus;
    createdAt: string;
    updatedAt: string;
    lastUsedAt?: string;
    personalization?: UserFineTunedModelPersonalization;
    metadata?: Record<string, unknown>;
}

export interface UserFineTunedModelData {
    userId: string;
    modelName: string;
    displayName: string;
    provider: UserFineTunedModelProvider;
    baseModel: string;
    status: UserFineTunedModelStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastUsedAt?: Timestamp;
    personalization?: UserFineTunedModelPersonalization;
    metadata?: Record<string, unknown>;
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
    previewPatternUri?: string;
    models: Model[];
    createdAt: string; // ISO String
    isPublic: boolean;
    orderCount: number;
    likeCount: number;
    likedBy: string[];
    favoriteCount: number;
    favoritedBy: string[];
    commentCount: number;
    shareCount: number;
    remakeCount: number;
}

// This is the object shape that is stored in Firestore.
// It uses the Timestamp from 'firebase-admin/firestore'.
export interface CreationData {
    userId: string;
    prompt: string;
    style: string;
    summary?: string;
    patternUri: string;
    previewPatternUri?: string;
    models: Model[];
    createdAt: Timestamp;
    isPublic: boolean;
    orderCount: number;
    likeCount: number;
    likedBy: string[];
    favoriteCount: number;
    favoritedBy: string[];
    commentCount: number;
    shareCount: number;
    remakeCount: number;
}


export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

// Client-side Order type
export interface OrderStatusEvent {
    status: OrderStatus;
    occurredAt: string;
    note?: string;
}

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
    paymentSummary: PaymentSummary;
    createdAt: string; // ISO string
    status: OrderStatus;
    statusHistory: OrderStatusEvent[];
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
    paymentSummary: PaymentSummary;
    createdAt: Timestamp;
    status: OrderStatus;
    statusHistory: {
        status: OrderStatus;
        occurredAt: Timestamp;
        note?: string;
    }[];
}

// Client-side Comment type
export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userPhotoURL: string;
    text: string;
    createdAt: string; // ISO string
}

// Firestore Comment data type
export interface CommentData {
    userId: string;
    userName: string;
    userPhotoURL: string;
    text: string;
    createdAt: Timestamp;
}
