import type { Metadata } from 'next';
import { getOrderById, requireOrderById } from '@/features/orders/commerce/order-service';
import { OrderDetails } from '@/features/orders/commerce/components/order-details';

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) {
    return {
      title: '订单未找到',
    };
  }
  return {
    title: `订单 ${order.id}`,
    description: `查看订单 ${order.id} 的支付与配送状态。`,
  };
}

export default async function OrderDetailsPage({ params }: OrderPageProps) {
  const { orderId } = await params;
  const order = await requireOrderById(orderId);
  return <OrderDetails order={order} />;
}
