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
