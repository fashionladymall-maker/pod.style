'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '../hooks/use-cart';

const formatPrice = (value: number, currency: string) =>
  new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);

export const CartPage = () => {
  const router = useRouter();
  const { items, totals, isEmpty, updateQuantity, removeItem, clearCart, totalCost } = useCart();

  const currency = totals?.currency ?? 'USD';

  const itemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:flex-row lg:gap-12">
      <section className="flex-1 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">购物车</h1>
          <p className="text-sm text-neutral-400">查看您选择的商品并完成结算。</p>
        </header>
        <Card className="border-neutral-800 bg-neutral-900 text-neutral-100">
          <CardContent className="divide-y divide-neutral-800 p-0">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center text-neutral-500">
                <p className="text-lg font-medium">您的购物车为空</p>
                <Button asChild variant="secondary" className="rounded-full px-6">
                  <Link href="/">去逛逛</Link>
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center">
                  <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-neutral-800 md:h-28 md:w-28">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="160px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">无图片</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{item.name}</h2>
                        <p className="text-sm text-neutral-400">SKU: {item.sku}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-neutral-500 transition hover:text-red-400"
                      >
                        移除
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                      <span>尺码 {item.variants.size}</span>
                      <Separator orientation="vertical" className="h-3 bg-neutral-700" />
                      <span>颜色 {item.variants.color}</span>
                      <Separator orientation="vertical" className="h-3 bg-neutral-700" />
                      <span>材质 {item.variants.material}</span>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center rounded-full border border-neutral-700 bg-neutral-950">
                        <Button
                          variant="ghost"
                          className="h-9 w-9 rounded-full text-lg"
                          type="button"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        >
                          −
                        </Button>
                        <span className="w-12 text-center text-base font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          className="h-9 w-9 rounded-full text-lg"
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          ＋
                        </Button>
                      </div>
                      <div className="text-right text-lg font-semibold text-white">
                        {formatPrice(item.price * item.quantity, item.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        {!isEmpty && (
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" className="rounded-full px-6 text-neutral-400" onClick={() => clearCart()}>
              清空购物车
            </Button>
            <Button asChild variant="secondary" className="rounded-full px-6 text-neutral-900">
              <Link href="/">继续购物</Link>
            </Button>
          </div>
        )}
      </section>
      <aside className="w-full max-w-sm space-y-6">
        <Card className="border-neutral-800 bg-neutral-900 text-neutral-100">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">订单摘要</h2>
            <div className="space-y-3 text-sm text-neutral-400">
              <div className="flex items-center justify-between text-neutral-300">
                <span>商品合计</span>
                <span>{formatPrice(itemsTotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>预计运费</span>
                <span>{formatPrice(totals?.shippingTotal ?? 0, currency)}</span>
              </div>
              <Separator className="bg-neutral-800" />
              <div className="flex items-center justify-between text-base font-semibold text-white">
                <span>应付总计</span>
                <span>{formatPrice(totalCost, currency)}</span>
              </div>
            </div>
            <Button
              size="lg"
              className="h-12 w-full rounded-full"
              disabled={isEmpty}
              onClick={() => router.push('/checkout')}
            >
              去结算
            </Button>
          </CardContent>
        </Card>
        <Card className="border-neutral-800 bg-neutral-900/70 text-neutral-200">
          <CardContent className="space-y-3 p-6 text-sm">
            <p>• 支持微信/银行卡支付，支付网关由 Stripe 提供。</p>
            <p>• 预计发货时间以结算页选择的配送方式为准。</p>
            <p>• 结算时可填写配送信息及发票需求。</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
};

export default CartPage;
