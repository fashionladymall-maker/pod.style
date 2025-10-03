'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UseEmblaCarouselType } from 'embla-carousel-react';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { FirebaseImage } from '@/components/ui/firebase-image';
import type { FeedItem } from '@/features/feed/server/feed-service';
import { cn } from '@/lib/utils';
import { CalendarDays, Sparkles } from 'lucide-react';
import { OmgActionBar } from './omg-action-bar';
import { OmgPreviewCanvas } from './omg-preview-canvas';

type CarouselApi = UseEmblaCarouselType[1];

export interface OmgFeedCardProps {
  item: FeedItem;
  baseImage: string;
  overlayImage?: string | null;
  isActive: boolean;
  isNearActive: boolean;
  shouldRender: boolean;
  isFavorited: boolean;
  isCompared: boolean;
  favoriteCount: number;
  shareCount: number;
  compareCount: number;
  onToggleFavorite: () => void;
  onShare: () => void;
  onToggleCompare: () => void;
  onPrefetch?: () => void;
}

export const formatNumber = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
};

export const OmgFeedCard = ({
  item,
  baseImage,
  overlayImage,
  isActive,
  isNearActive,
  shouldRender,
  isFavorited,
  isCompared,
  favoriteCount,
  shareCount,
  compareCount,
  onToggleFavorite,
  onShare,
  onToggleCompare,
  onPrefetch,
}: OmgFeedCardProps) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!isNearActive || !onPrefetch) return;
    onPrefetch();
  }, [isNearActive, onPrefetch]);

  const modelImages = useMemo(() => {
    return (item.creation.models ?? [])
      .map((model) => model.previewUri ?? model.modelUri ?? model.uri)
      .filter((uri): uri is string => Boolean(uri));
  }, [item.creation.models]);

  const stats = useMemo(
    () => [
      { label: '收藏', value: formatNumber(item.creation.favoriteCount) },
      { label: '分享', value: formatNumber(item.creation.shareCount) },
      { label: '评论', value: formatNumber(item.creation.commentCount) },
    ],
    [item.creation.favoriteCount, item.creation.shareCount, item.creation.commentCount],
  );

  const rankingSignals = useMemo(() => {
    const entries = Object.entries(item.rankingSignals ?? {});
    return entries.slice(0, 4).map(([key, value]) => ({ key, value: value.toFixed(1) }));
  }, [item.rankingSignals]);

  const creation = item.creation;
  const createdAtLabel = useMemo(() => {
    const parsed = new Date(creation.createdAt);
    if (Number.isNaN(parsed.getTime())) {
      return '日期未知';
    }
    return parsed.toLocaleDateString();
  }, [creation.createdAt]);

  useEffect(() => {
    if (!carouselApi || !isActive) return;
    carouselApi.scrollTo(0, true);
  }, [carouselApi, isActive]);

  useEffect(() => {
    if (!carouselApi || !isActive) return;

    const interval = window.setInterval(() => {
      if (!carouselApi) return;
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [carouselApi, isActive]);

  return (
    <article
      className={cn(
        'relative flex w-full max-w-5xl items-center justify-center transition-opacity duration-500',
        isActive ? 'opacity-100' : 'opacity-70',
      )}
    >
      <div className="relative flex h-[88dvh] w-full max-w-4xl flex-col items-center justify-center">
        <div
          className={cn(
            'relative h-full w-full overflow-hidden rounded-[48px] border border-white/10 bg-neutral-900/60 shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-lg',
            'transition-transform duration-700 ease-out',
            isActive ? 'scale-100' : 'scale-[0.96]',
          )}
        >
          {shouldRender ? (
            <Carousel className="h-full" opts={{ loop: true, align: 'center' }} setApi={setCarouselApi}>
              <CarouselContent className="h-full">
                <CarouselItem className="h-full">
                  <OmgPreviewCanvas
                    baseImage={baseImage}
                    overlayImage={overlayImage ?? modelImages[0] ?? null}
                    title={creation.summary ?? creation.prompt}
                    subtitle={creation.style ?? undefined}
                    stats={stats}
                    accentColor={creation.isPublic ? '#38bdf8' : '#ec4899'}
                    shouldRender={shouldRender}
                  />
                </CarouselItem>
                {modelImages.map((uri, index) => (
                  <CarouselItem key={`${creation.id}-model-${index}`} className="h-full">
                    <div className="relative h-full w-full overflow-hidden rounded-[48px]">
                      <FirebaseImage
                        src={uri as string}
                        alt={creation.summary ?? creation.prompt}
                        fill
                        className="object-cover"
                        quality={90}
                        priority={isActive && index === 0}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-8 hidden h-12 w-12 rounded-full border-white/20 bg-black/40 text-white md:flex" />
              <CarouselNext className="right-8 hidden h-12 w-12 rounded-full border-white/20 bg-black/40 text-white md:flex" />
            </Carousel>
          ) : (
            <div className="flex h-full w-full animate-pulse items-center justify-center bg-neutral-900 text-neutral-700">
              Loading preview...
            </div>
          )}

          <header className="pointer-events-none absolute left-0 right-0 top-0 flex flex-col gap-4 px-10 py-8 text-white">
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <Badge variant="secondary" className="bg-white/15 text-white">
                {item.source === 'cache' ? '个性化推荐' : '公共回退'}
              </Badge>
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-neutral-400">
                <Sparkles className="h-3.5 w-3.5" />
                OMG FEED
              </span>
            </div>
            <div className="pointer-events-auto flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-300">由 {creation.userName ?? creation.userId}</p>
                <h2 className="max-w-2xl text-3xl font-semibold leading-tight text-white">
                  {creation.summary ?? creation.prompt}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <CalendarDays className="h-4 w-4" />
                <span>{createdAtLabel}</span>
              </div>
            </div>
          </header>

          <footer className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-4 px-10 pb-10 text-neutral-200">
            <div className="flex flex-wrap gap-2 text-sm text-neutral-400">
              {rankingSignals.length > 0 ? (
                rankingSignals.map((signal) => (
                  <span
                    key={signal.key}
                    className="rounded-full border border-white/10 bg-black/30 px-4 py-1 text-xs tracking-wider text-neutral-200"
                  >
                    {signal.key}: {signal.value}
                  </span>
                ))
              ) : (
                <span className="text-xs text-neutral-500">暂无排名信号</span>
              )}
            </div>
            <div className="grid gap-2 text-sm text-neutral-300 md:w-2/3">
              <p className="leading-relaxed text-neutral-200">
                {creation.prompt.length > 160 ? `${creation.prompt.slice(0, 157)}...` : creation.prompt}
              </p>
            </div>
          </footer>

          <div className="pointer-events-none absolute inset-0 rounded-[48px] ring-1 ring-white/5" />
        </div>

        <div className="pointer-events-none mt-6 flex items-center justify-center gap-3 text-xs text-neutral-500 md:hidden">
          <span>滑动切换角度，长按收藏</span>
        </div>

        <div className="pointer-events-none absolute -right-24 top-1/2 hidden -translate-y-1/2 md:block">
          <OmgActionBar
            className="pointer-events-auto"
            favoriteCount={favoriteCount}
            shareCount={shareCount}
            compareCount={compareCount}
            isFavorited={isFavorited}
            isCompared={isCompared}
            onToggleFavorite={onToggleFavorite}
            onShare={onShare}
            onToggleCompare={onToggleCompare}
          />
        </div>

        <div className="pointer-events-auto mt-8 w-full md:hidden">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur">
            <OmgActionBar
              className="w-full justify-around"
              orientation="horizontal"
              favoriteCount={favoriteCount}
              shareCount={shareCount}
              compareCount={compareCount}
              isFavorited={isFavorited}
              isCompared={isCompared}
              onToggleFavorite={onToggleFavorite}
              onShare={onShare}
              onToggleCompare={onToggleCompare}
            />
          </div>
        </div>
      </div>
    </article>
  );
};

export default OmgFeedCard;
