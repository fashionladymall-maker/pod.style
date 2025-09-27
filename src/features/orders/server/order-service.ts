import type { Order, OrderDetails, PaymentSummary, ShippingInfo } from '@/lib/types';
import { createOrder, listOrdersByUser } from './order-repository';
import { nowTimestamp, type OrderDocument } from './order-model';
import { logInteraction } from '@/features/creations/server/creation-service';

export interface CreateOrderInput {
  userId: string;
  creationId: string;
  modelUri: string;
  category: string;
  orderDetails: OrderDetails;
  shippingInfo: ShippingInfo;
  paymentSummary: PaymentSummary;
  price: number;
}

export const placeOrder = async (input: CreateOrderInput): Promise<Order> => {
  const { userId, creationId, modelUri, category, orderDetails, shippingInfo, paymentSummary, price } = input;

  const orderDoc: OrderDocument = {
    userId,
    creationId,
    modelUri,
    category,
    size: orderDetails.size,
    colorName: orderDetails.colorName,
    quantity: orderDetails.quantity,
    price,
    shippingInfo,
    paymentSummary,
    createdAt: nowTimestamp(),
    status: 'Processing',
    statusHistory: [
      {
        status: 'Processing',
        occurredAt: nowTimestamp(),
      },
    ],
  };

  const order = await createOrder(orderDoc);
  await logInteraction({
    action: 'order',
    creationId,
    userId,
    weight: orderDetails.quantity,
  });

  return order;
};

export const getOrdersForUser = async (userId: string): Promise<Order[]> => {
  if (!userId) {
    return [];
  }
  return listOrdersByUser(userId);
};
