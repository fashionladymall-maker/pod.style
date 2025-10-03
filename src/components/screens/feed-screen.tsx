'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getMoreFeedAction, getFeedUpdatesAction } from '@/features/feed/server/actions';
import type { FeedItem, FeedResponse } from '@/features/feed/server/feed-service';
import { useFeedRefresh } from '@/features/feed/hooks/use-feed-refresh';
import { OmgFeedContainer } from '@/components/omg/omg-feed-container';
import { OmgFeedCard } from '@/components/omg/omg-feed-card';
import {
  derivePreviewAssetUri,
  fetchStandardPreview,
  type StandardPreviewResponse,
} from '@/features/feed/client/preview-service';

interface FeedScreenProps {
  initialFeed: FeedResponse;
  region?: string | null;
  locale?: string | null;
  refreshEnabled?: boolean;
}

const DEFAULT_PLACEHOLDER = 'https://via.placeholder.com/512x512.png?text=Pod.Style';

const uniqueKey = (item: FeedItem) => `${item.source}:${item.id}`;

export const FeedScreen = ({ initialFeed, region, locale, refreshEnabled }: FeedScreenProps) => {
  const [items, setItems] = useState<FeedItem[]>(initialFeed.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialFeed.nextCursor);
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const [shareOverrides, setShareOverrides] = useState<Record<string, number>>({});
  const [compareSet, setCompareSet] = useState<Set<string>>(() => new Set());
  const [previewCache, setPreviewCache] = useState<Record<string, StandardPreviewResponse | null>>({});
  const previewInFlightRef = useRef(new Map<string, Promise<StandardPreviewResponse | null>>());
  const latestUpdatedAtRef = useRef<string | null>(null);
  const { toast } = useToast();

  const isRefreshActive = useMemo(() => {
    if (typeof refreshEnabled === 'boolean') {
      return refreshEnabled;
    }
    return process.env.NEXT_PUBLIC_ENABLE_FEED_REFRESH === 'true';
  }, [refreshEnabled]);

  const computeLatestUpdatedAt = useCallback((list: FeedItem[]) => {
    return list.reduce<string | null>((latest, item) => {
      if (!item.updatedAt) return latest;
      if (!latest || item.updatedAt > latest) {
        return item.updatedAt;
      }
      return latest;
    }, null);
  }, []);

  useEffect(() => {
    latestUpdatedAtRef.current = computeLatestUpdatedAt(items) ?? null;
  }, [items, computeLatestUpdatedAt]);

  const hasMore = Boolean(nextCursor);

  const mergeIncomingItems = useCallback(
    (incoming: FeedItem[]) => {
      if (incoming.length === 0) {
        return 0;
      }
      let addedCount = 0;
      setItems((previous) => {
        const existingIds = new Set(previous.map((entry) => entry.creation.id));
        const freshItems = incoming.filter((entry) => !existingIds.has(entry.creation.id));
        addedCount = freshItems.length;
        if (addedCount === 0) {
          return previous;
        }
        return [...freshItems, ...previous];
      });
      if (addedCount > 0) {
        setActiveIndex((current) => current + addedCount);
      }
      return addedCount;
    },
    [],
  );

  const fetchPreviewForItem = useCallback(
    async (item: FeedItem): Promise<StandardPreviewResponse | null> => {
      const creationId = item.creation.id;
      if (previewCache[creationId] !== undefined) {
        return previewCache[creationId];
      }

      const inFlight = previewInFlightRef.current.get(creationId);
      if (inFlight) {
        return inFlight;
      }

      const assetUri = derivePreviewAssetUri(item.creation);
      if (!assetUri) {
        setPreviewCache((previous) => ({ ...previous, [creationId]: null }));
        return null;
      }
      const request = fetchStandardPreview({
        creationId,
        assetUri,
        variant: item.creation.style,
      })
        .then((result) => {
          setPreviewCache((previous) => ({ ...previous, [creationId]: result ?? null }));
          return result ?? null;
        })
        .catch((error) => {
          if (!(error instanceof Error && error.name === 'AbortError')) {
            console.error('feed.preview.fetch_error', error);
          }
          setPreviewCache((previous) => ({ ...previous, [creationId]: null }));
          return null;
        })
        .finally(() => {
          previewInFlightRef.current.delete(creationId);
        });

      previewInFlightRef.current.set(creationId, request);
      return request;
    },
    [previewCache],
  );

  useEffect(() => {
    const currentItem = items[activeIndex];
    if (currentItem) {
      void fetchPreviewForItem(currentItem);
    }
    const nextItem = items[activeIndex + 1];
    if (nextItem) {
      void fetchPreviewForItem(nextItem);
    }
  }, [activeIndex, items, fetchPreviewForItem]);

  const fetchUpdates = useCallback(async () => {
    try {
      const response = await getFeedUpdatesAction({
        region: region ?? undefined,
        locale: locale ?? undefined,
        updatedAfter: latestUpdatedAtRef.current ?? undefined,
      });
      if (response.items.length > 0) {
        mergeIncomingItems(response.items);
      }
      return response.items.length;
    } catch (error) {
      console.error('feed.refresh.fetch_failed', error);
      throw error;
    }
  }, [region, locale, mergeIncomingItems]);

  useFeedRefresh({
    enabled: isRefreshActive,
    fetchUpdates,
  });

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isPending || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    startTransition(() => {
      getMoreFeedAction({
        cursor: nextCursor ?? undefined,
        region: region ?? undefined,
        locale: locale ?? undefined,
      })
        .then((result) => {
          if (result.items.length === 0) {
            setNextCursor(null);
            toast({ title: '没有更多作品了', description: '您已经浏览了当日的全部创意。' });
            return;
          }
          setItems((previous) => [...previous, ...result.items]);
          setNextCursor(result.nextCursor);
        })
        .catch((error) => {
          console.error('加载更多 feed 数据失败', error);
          toast({
            title: '无法加载更多作品',
            description: '请稍后重试，我们已记录错误。',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setIsLoadingMore(false);
        });
    });
  }, [hasMore, isPending, isLoadingMore, nextCursor, region, locale, startTransition, toast]);

  const handleToggleFavorite = useCallback(
    (item: FeedItem) => {
      const creationId = item.creation.id;
      let alreadyFavorited = false;

      setFavoriteOverrides((previous) => {
        alreadyFavorited = Boolean(previous[creationId]);
        const next = { ...previous };
        if (alreadyFavorited) {
          delete next[creationId];
        } else {
          next[creationId] = true;
        }
        return next;
      });

      toast({
        title: alreadyFavorited ? '已取消收藏' : '已收藏作品',
        description: alreadyFavorited ? '我们会减少类似内容的推荐。' : '个性化推荐将优先考虑类似创意。',
      });
    },
    [toast],
  );

  const handleToggleCompare = useCallback(
    (item: FeedItem) => {
      const creationId = item.creation.id;
      let alreadyCompared = false;
      let nextSize = 0;

      setCompareSet((previous) => {
        alreadyCompared = previous.has(creationId);
        const next = new Set(previous);
        if (alreadyCompared) {
          next.delete(creationId);
        } else {
          next.add(creationId);
        }
        nextSize = next.size;
        return next;
      });

      toast({
        title: alreadyCompared ? '已移出对比列表' : '已加入对比列表',
        description: alreadyCompared
          ? '该作品已从对比列表中移除。'
          : `当前对比列表含 ${nextSize} 个作品`,
      });
    },
    [toast],
  );

  const handleShare = useCallback(
    async (item: FeedItem) => {
      if (typeof window === 'undefined') {
        return;
      }

      const creationId = item.creation.id;
      const shareUrl = `${window.location.origin}/creations/${creationId}`;
      const title = item.creation.summary ?? 'Pod.Style 创意';
      const text = item.creation.prompt;

      try {
        if (navigator.share) {
          await navigator.share({ title, text, url: shareUrl });
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        }
        setShareOverrides((previous) => ({
          ...previous,
          [creationId]: (previous[creationId] ?? 0) + 1,
        }));
        toast({
          title: '已分享作品',
          description: '链接已准备好，可发送给朋友或社群。',
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('feed.share.failed', error);
          toast({
            title: '无法分享作品',
            description: '请手动复制链接或稍后再试。',
            variant: 'destructive',
          });
        }
      }
    },
    [toast],
  );

  const prefetchPreview = useCallback(
    (item: FeedItem) => {
      void fetchPreviewForItem(item);
    },
    [fetchPreviewForItem],
  );

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-12 text-center text-neutral-200">
        <p className="text-2xl font-semibold">feed 还在建设中</p>
        <p className="text-neutral-400">目前暂无可浏览的作品，请稍后再来或返回旧版首页。</p>
        <Button variant="outline" asChild>
          <Link href="/">返回首页</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="relative flex h-dvh w-full overflow-hidden bg-neutral-950 text-neutral-50">
      <OmgFeedContainer
        items={items}
        activeIndex={activeIndex}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
        onActiveIndexChange={setActiveIndex}
        renderItem={(item, renderProps) => {
          const creationId = item.creation.id;
          const preview = previewCache[creationId] ?? null;
          const baseImage = derivePreviewAssetUri(item.creation) ?? DEFAULT_PLACEHOLDER;
          const overlayImage = preview?.imageUrl ?? null;
          const favoriteCount = item.creation.favoriteCount + (favoriteOverrides[creationId] ? 1 : 0);
          const shareCount = item.creation.shareCount + (shareOverrides[creationId] ?? 0);
          const compareCount = Math.max(compareSet.size, item.creation.remakeCount);

          return (
            <OmgFeedCard
              key={uniqueKey(item)}
              item={item}
              baseImage={baseImage}
              overlayImage={overlayImage}
              isActive={renderProps.isActive}
              isNearActive={renderProps.isNearActive}
              shouldRender={renderProps.shouldRender}
              isFavorited={Boolean(favoriteOverrides[creationId])}
              isCompared={compareSet.has(creationId)}
              favoriteCount={favoriteCount}
              shareCount={shareCount}
              compareCount={compareCount}
              onToggleFavorite={() => handleToggleFavorite(item)}
              onShare={() => {
                void handleShare(item);
              }}
              onToggleCompare={() => handleToggleCompare(item)}
              onPrefetch={renderProps.shouldRender ? () => prefetchPreview(item) : undefined}
            />
          );
        }}
      />
    </main>
  );
};

export default FeedScreen;
