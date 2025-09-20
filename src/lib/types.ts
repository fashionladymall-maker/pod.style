import type { User as FirebaseUserType } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";

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

export interface Creation {
    id: string;
    userId: string;
    prompt: string;
    style: string;
    category: string;
    patternUri: string;
    modelUri: string | null;
    createdAt: Timestamp;
}
