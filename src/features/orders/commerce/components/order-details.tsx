'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { OrderSummary } from '../order-model';

const formatPrice = (value: number, currency: string) =>
  new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);

const statusLabel: Record<OrderSummary['status'], string> = {
  created: '已创建',
  paid: '已支付',
  processing: '处理中',
  shipped: '已发货',
  delivered: '已完成',
  cancelled: '已取消',
};

interface OrderDetailsProps {
  order: OrderSummary;
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const itemTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = order.shipping.cost;
  const totalPaid = order.payment.amount;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-white">订单 #{order.id}</h1>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm text-neutral-900">
            {statusLabel[order.status]}
          </Badge>
        </div>
        <p className="text-sm text-neutral-400">下单时间：{new Date(order.createdAt).toLocaleString('zh-CN')}</p>
      </header>
      <Card className="border-neutral-800 bg-neutral-900 text-neutral-100">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">商品信息</h2>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={`${item.sku}-${index}`} className="rounded-2xl border border-neutral-800 px-4 py-4 text-sm">
                  <div className="flex items-center justify-between text-neutral-300">
                    <div className="space-y-1">
                      <p className="text-base font-medium text-white">{item.name ?? item.sku}</p>
                      <p className="text-xs text-neutral-500">SKU: {item.sku}</p>
                    </div>
                    <span>{formatPrice(item.price * item.quantity, order.payment.currency)}</span>
                  </div>
                  <Separator className="my-3 bg-neutral-800" />
                  <div className="flex flex-wrap gap-3 text-neutral-400">
                    <span>数量 x{item.quantity}</span>
                    {Object.entries(item.variants).map(([key, value]) => (
                      <span key={key} className="capitalize">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Separator className="bg-neutral-800" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 text-sm text-neutral-300">
              <h3 className="text-lg font-semibold text-white">配送信息</h3>
              <p>收货人：{order.shipping.name}</p>
              <p>联系电话：{order.shipping.phone}</p>
              <p>地址：{order.shipping.address}</p>
              <p>配送方式：{order.shipping.method === 'express' ? '快速配送' : '标准配送'}</p>
              <p>运费：{formatPrice(shipping, order.payment.currency)}</p>
            </div>
            <div className="space-y-3 text-sm text-neutral-300">
              <h3 className="text-lg font-semibold text-white">支付信息</h3>
              <p>支付方式：Stripe</p>
              <p>支付金额：{formatPrice(totalPaid, order.payment.currency)}</p>
              <p>Payment Intent：{order.payment.stripePaymentIntentId}</p>
              {order.payment.paidAt && <p>支付时间：{new Date(order.payment.paidAt).toLocaleString('zh-CN')}</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950 px-4 py-4 text-sm text-neutral-400">
            物流追踪功能即将上线，当前可通过客服查询最新进度。
          </div>
          <Separator className="bg-neutral-800" />
          <div className="space-y-2 text-sm text-neutral-300">
            <div className="flex items-center justify-between">
              <span>商品合计</span>
              <span>{formatPrice(itemTotal, order.payment.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>配送费用</span>
              <span>{formatPrice(shipping, order.payment.currency)}</span>
            </div>
            <Separator className="bg-neutral-800" />
            <div className="flex items-center justify-between text-base font-semibold text-white">
              <span>支付总额</span>
              <span>{formatPrice(totalPaid, order.payment.currency)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="secondary" className="rounded-full px-6 text-neutral-900" asChild>
              <Link href="/">继续购物</Link>
            </Button>
            <Button variant="ghost" className="rounded-full px-6 text-neutral-400" asChild>
              <Link href="/cart">查看购物车</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
