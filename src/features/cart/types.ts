export interface CartVariants {
  size: string;
  color: string;
  material: string;
}

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  image?: string;
  designId?: string | null;
  variants: CartVariants;
  quantity: number;
  price: number;
  currency: string;
  shippingPrice?: number;
  shippingMethod?: 'standard' | 'express';
  subtotal?: number;
  metadata?: Record<string, unknown>;
}

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error?: string;
}

export interface SubtotalBreakdown {
  itemsTotal: number;
  shippingTotal: number;
  currency: string;
}

export type AddCartItemInput = Omit<CartItem, 'id'> & { id?: string };
