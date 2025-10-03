import type { User as FirebaseUserType, AuthCredential } from "firebase/auth";
import type { Timestamp } from "firebase-admin/firestore";

export type FirebaseUser = FirebaseUserType;
export type { AuthCredential };

export interface OrderDetails {
    color: string;
    colorName: string;
    size: string;
    quantity: number;
}

export interface ShippingInfo {
    name: string;
    fullName?: string;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone: string;
    email?: string;
}

export interface PaymentInfo {
    cardNumber?: string;
    cardName?: string;
    expiryDate?: string;
    cvv?: string;
    brand?: string;
}

export interface PaymentSummary {
    tokenId: string;
    brand: string;
    last4: string;
    gateway: 'stripe' | 'paypal' | 'mock';
    status: 'requires_action' | 'pending' | 'succeeded' | 'failed';
}

export interface Model {
    uri: string;
    modelUri?: string;
    category: string;
    isPublic?: boolean;
    previewUri?: string;
    createdAt?: string;
    updatedAt?: string;
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

// Client-side representation of a creation.
export interface Creation {
    id: string;
    userId: string;
    userName?: string;
    userAvatar?: string;
    prompt: string;
    style: string;
    summary?: string;
    patternUri: string;
    previewPatternUri?: string;
    models: Model[];
    createdAt: string;
    isPublic: boolean;
    orderCount: number;
    likeCount: number;
    likedBy: string[];
    isLiked?: boolean;
    favoriteCount: number;
    favoritedBy: string[];
    isFavorited?: boolean;
    commentCount: number;
    shareCount: number;
    remakeCount: number;
    viewCount?: number;
    hashtags?: string[];
}

// Firestore representation of a creation.
export interface CreationData {
    userId: string;
    userName?: string;
    userAvatar?: string;
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
    viewCount?: number;
    hashtags?: string[];
}

export type OrderStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'failed'
    | 'created'
    | 'paid'
    | 'Processing'
    | 'Shipped'
    | 'Delivered'
    | 'Cancelled';

export interface OrderStatusEvent {
    status: OrderStatus;
    occurredAt: string;
    note?: string;
}

export interface OrderItem {
    sku: string;
    name?: string;
    designId?: string;
    variants?: Record<string, string>;
    quantity: number;
    price: number;
    modelUri?: string;
}

export interface Order {
    id: string;
    userId: string;
    creationId: string;
    modelUri?: string;
    category: string;
    size: string;
    colorName: string;
    quantity: number;
    price: number;
    shippingInfo: ShippingInfo;
    paymentSummary?: PaymentSummary;
    paymentInfo?: PaymentInfo;
    createdAt: string;
    status: OrderStatus;
    statusHistory?: OrderStatusEvent[];
    items?: OrderItem[];
}

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
    paymentSummary?: PaymentSummary;
    createdAt: Timestamp;
    status: OrderStatus;
    statusHistory: {
        status: OrderStatus;
        occurredAt: Timestamp;
        note?: string;
    }[];
    items?: OrderItem[];
    paymentInfo?: PaymentInfo;
}

export interface LegacyComment {
    id: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    content: string;
    createdAt: string;
    text?: string;
}

export interface Comment {
    id: string;
    creationId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    userPhotoURL?: string;
    content: string;
    likeCount: number;
    likedBy?: string[];
    isLiked?: boolean;
    replyCount: number;
    replies?: Comment[];
    parentId?: string | null;
    isDeleted?: boolean;
    createdAt: string;
}

export interface CommentData {
    id?: string;
    creationId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    userPhotoURL?: string;
    content: string;
    likedBy?: string[];
    likeCount: number;
    replyCount: number;
    parentId?: string | null;
    isDeleted?: boolean;
    createdAt: Timestamp;
}

export interface LegacyCommentData {
    userId: string;
    userName: string;
    userPhotoURL?: string;
    content: string;
    text?: string;
    createdAt: Timestamp;
}

export interface CommentInput {
    creationId: string;
    userId: string;
    content: string;
    parentId?: string;
}

export interface Follow {
    id: string;
    followerId: string;
    followingId: string;
    followerName: string;
    followerAvatar?: string;
    followingName: string;
    followingAvatar?: string;
    createdAt: string;
}

export interface FollowInput {
    followerId: string;
    followingId: string;
}

export interface FollowStats {
    followingCount: number;
    followersCount: number;
    isFollowing?: boolean;
    isFollowedBy?: boolean;
}

export interface Hashtag {
    id: string;
    name: string;
    count: number;
    createdAt: string;
    updatedAt?: string;
}

export interface HashtagUsage {
    id: string;
    hashtagId: string;
    hashtagName: string;
    creationId: string;
    userId: string;
    createdAt: string;
}

export interface ViewHistory {
    id: string;
    userId: string;
    creationId: string;
    viewedAt: string;
    duration?: number;
}

export type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'system' | 'order';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    actorId?: string;
    actorName?: string;
    actorAvatar?: string;
    relatedId?: string;
    link?: string;
    createdAt: string;
    isRead: boolean;
    metadata?: Record<string, unknown>;
}

export interface NotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    actorId?: string;
    relatedId?: string;
    link?: string;
    metadata?: Record<string, unknown>;
}

export interface Mention {
    id: string;
    mentionedUserId: string;
    mentionedUserName: string;
    mentionerUserId: string;
    creationId?: string;
    commentId?: string;
    createdAt: string;
}
