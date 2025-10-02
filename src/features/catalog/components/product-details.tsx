'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCart } from '@/features/cart/hooks/use-cart';
import type { Sku } from '../server/sku-model';
import { formatVariantKey, getDefaultSelection, getVariantStock, type VariantSelection } from '../utils';

const formatPrice = (value: number, currency: string) =>
  new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);

interface ProductDetailsProps {
  sku: Sku;
}

const VariantSelector = ({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (option: string) => void;
}) => (
  <div className="space-y-2">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option}
          variant={option === value ? 'default' : 'secondary'}
          className={cn('rounded-full px-4 py-2 text-sm', option === value && 'shadow-lg')}
          onClick={() => onSelect(option)}
          type="button"
        >
          {option}
        </Button>
      ))}
    </div>
  </div>
);

export function ProductDetails({ sku }: ProductDetailsProps) {
  const router = useRouter();
  const { items, addItem } = useCart();
  const [selection, setSelection] = useState<VariantSelection>(() => getDefaultSelection(sku));
  const [quantity, setQuantity] = useState<number>(1);

  const stock = useMemo(() => getVariantStock(sku, selection), [sku, selection]);
  const isOutOfStock = stock <= 0;

  const lineSubtotal = useMemo(() => quantity * sku.basePrice, [quantity, sku.basePrice]);

  const primaryImage = sku.images[0] ?? '/placeholder.png';

  const handleVariantChange = (type: keyof VariantSelection, value: string) => {
    setSelection((current) => ({ ...current, [type]: value }));
    setQuantity(1);
  };

  const handleAddItem = async (redirectToCheckout: boolean) => {
    if (isOutOfStock) {
      return;
    }
    const variantKey = formatVariantKey(selection);
    const cartId = `${sku.id}::${variantKey}`;
    const existing = items.find((item) => item.id === cartId);
    const nextQuantity = Math.min(stock, (existing?.quantity ?? 0) + quantity);

    await addItem({
      id: cartId,
      sku: sku.id,
      name: sku.name,
      image: primaryImage,
      variants: selection,
      quantity: nextQuantity,
      price: sku.basePrice,
      currency: sku.currency,
      shippingPrice: sku.shipping.standard.price,
      shippingMethod: 'standard',
      metadata: {
        variantKey,
        description: sku.description,
        standardShippingPrice: sku.shipping.standard.price,
        expressShippingPrice: sku.shipping.express.price,
        standardShippingDays: sku.shipping.standard.days,
        expressShippingDays: sku.shipping.express.days,
      },
    });

    if (redirectToCheckout) {
      router.push('/checkout');
    }
  };

  return (
    <div className="grid gap-12 px-6 py-12 lg:grid-cols-[1.2fr_1fr] lg:px-16 xl:px-24">
      <section className="space-y-6">
        <Carousel className="w-full overflow-hidden rounded-3xl bg-neutral-900">
          <CarouselContent>
            {sku.images.map((image, index) => (
              <CarouselItem key={image}>
                <div className="relative aspect-square w-full">
                  <Image
                    src={image}
                    alt={`${sku.name} 视图 ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    priority={index === 0}
                  />
                </div>
              </CarouselItem>
            ))}
            {sku.images.length === 0 && (
              <CarouselItem>
                <div className="flex aspect-square w-full items-center justify-center bg-neutral-800 text-sm text-neutral-400">
                  暂无商品图片
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
          {sku.images.length > 1 && (
            <>
              <CarouselPrevious className="left-4 bg-black/50 text-white hover:bg-black/70" />
              <CarouselNext className="right-4 bg-black/50 text-white hover:bg-black/70" />
            </>
          )}
        </Carousel>
        <Card className="bg-neutral-900 text-neutral-100">
          <CardContent className="space-y-6 p-6">
            <div className="space-y-3">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-wider text-neutral-400">
                SKU · {sku.id}
              </Badge>
              <h1 className="text-3xl font-semibold">{sku.name}</h1>
              <p className="text-base leading-relaxed text-neutral-400">{sku.description}</p>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold text-white">{formatPrice(sku.basePrice, sku.currency)}</p>
              <span className="text-sm text-neutral-500">含标准配送费 {formatPrice(sku.shipping.standard.price, sku.currency)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
              <span>库存状态:</span>
              {isOutOfStock ? (
                <Badge variant="destructive" className="rounded-full px-3 py-1 text-sm">暂时缺货</Badge>
              ) : (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-sm border-neutral-700 text-neutral-200">
                  {stock} 件可售
                </Badge>
              )}
              <span className="text-neutral-600">·</span>
              <span>配送：标准 {sku.shipping.standard.days} 天 / 快速 {sku.shipping.express.days} 天</span>
            </div>
            <div className="space-y-6">
              <VariantSelector
                label="尺码"
                options={sku.variants.size}
                value={selection.size}
                onSelect={(option) => handleVariantChange('size', option)}
              />
              <VariantSelector
                label="颜色"
                options={sku.variants.color}
                value={selection.color}
                onSelect={(option) => handleVariantChange('color', option)}
              />
              <VariantSelector
                label="材质"
                options={sku.variants.material}
                value={selection.material}
                onSelect={(option) => handleVariantChange('material', option)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-full border border-neutral-700 bg-neutral-950">
                <Button
                  variant="ghost"
                  className="h-10 w-10 rounded-full text-xl"
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  −
                </Button>
                <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  className="h-10 w-10 rounded-full text-xl"
                  type="button"
                  disabled={quantity >= stock && stock !== 0}
                  onClick={() => setQuantity((prev) => (!stock ? prev : Math.min(stock, prev + 1)))}
                >
                  ＋
                </Button>
              </div>
              <div className="text-sm text-neutral-400">
                小计 {formatPrice(lineSubtotal, sku.currency)}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 flex-1 rounded-full"
                disabled={isOutOfStock}
                onClick={() => handleAddItem(false)}
              >
                加入购物车
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-12 flex-1 rounded-full"
                disabled={isOutOfStock}
                onClick={() => handleAddItem(true)}
              >
                立即购买
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-6 text-sm text-neutral-400">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6">
          <h2 className="text-lg font-semibold text-neutral-200">配送与售后</h2>
          <ul className="mt-4 space-y-2">
            <li>• 标准配送 {sku.shipping.standard.days} 天，费用 {formatPrice(sku.shipping.standard.price, sku.currency)}</li>
            <li>• 快速配送 {sku.shipping.express.days} 天，费用 {formatPrice(sku.shipping.express.price, sku.currency)}</li>
            <li>• 支持 7 天无理由退换，定制瑕疵免运费处理</li>
          </ul>
        </div>
        {sku.attributes && (
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6">
            <h2 className="text-lg font-semibold text-neutral-200">商品参数</h2>
            <dl className="mt-4 space-y-2 text-neutral-400">
              {Object.entries(sku.attributes).map(([key, value]) => (
                <div key={key} className="flex gap-3">
                  <dt className="min-w-[96px] capitalize text-neutral-500">{key}</dt>
                  <dd className="flex-1 text-neutral-200">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </aside>
    </div>
  );
}
