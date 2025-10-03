import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetails } from '@/features/catalog/components/product-details';
import { getSkuById } from '@/features/catalog/server/sku-service';

interface ProductPageProps {
  params: Promise<{ sku: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { sku } = await params;
  const skuData = await getSkuById(decodeURIComponent(sku));
  if (!skuData) {
    return {
      title: '商品不存在',
    };
  }

  return {
    title: `${skuData.name} | 商品详情`,
    description: skuData.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { sku } = await params;
  const skuData = await getSkuById(decodeURIComponent(sku));
  if (!skuData) {
    notFound();
  }
  return <ProductDetails sku={skuData} />;
}
