'use client';

import { useMemo, useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { FirebaseImage } from '@/components/ui/firebase-image';
import Link from 'next/link';
import { getMoreFeedAction, getFeedUpdatesAction } from '@/features/feed/server/actions';
import type { FeedItem, FeedResponse } from '@/features/feed/server/feed-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useFeedRefresh } from '@/features/feed/hooks/use-feed-refresh';

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
  const [lastSource, setLastSource] = useState(initialFeed.source);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const latestUpdatedAtRef = useRef<string | null>(null);

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

  const heading = useMemo(() => {
    if (lastSource === 'cache') {
      return '为你精选的个性化创意';
    }
    return '热门创意精选';
  }, [lastSource]);

  const hasMore = Boolean(nextCursor);

  const mergeIncomingItems = useCallback(
    (incoming: FeedItem[]) => {
      if (incoming.length === 0) return;
      setItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.creation.id));
        const freshItems = incoming.filter((item) => !existingIds.has(item.creation.id));
        if (freshItems.length === 0) {
          return prev;
        }
        return [...freshItems, ...prev];
      });
    },
    [],
  );

  const fetchUpdates = useCallback(async () => {
    try {
      const response = await getFeedUpdatesAction({
        region: region ?? undefined,
        locale: locale ?? undefined,
        updatedAfter: latestUpdatedAtRef.current ?? undefined,
      });
      if (response.items.length > 0) {
        mergeIncomingItems(response.items);
        setLastSource(response.source);
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

  const handleLoadMore = () => {
    if (!hasMore || isPending) return;

    startTransition(() => {
      getMoreFeedAction({ cursor: nextCursor ?? undefined, region: region ?? undefined, locale: locale ?? undefined })
        .then((result) => {
          if (result.items.length === 0) {
            setNextCursor(null);
            toast({ title: '没有更多作品了', description: '您已经浏览了当日的全部创意。' });
            return;
          }
          setItems((prev) => [...prev, ...result.items]);
          setNextCursor(result.nextCursor);
          setLastSource(result.source);
        })
        .catch((error) => {
          console.error('加载更多 feed 数据失败', error);
          toast({
            title: '无法加载更多作品',
            description: '请稍后重试，我们已记录错误。',
            variant: 'destructive',
          });
        });
    });
  };

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
    <main
      className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10"
      data-refresh-enabled={isRefreshActive ? 'true' : 'false'}
    >
      <header className="mb-8 flex flex-col gap-2 text-neutral-100">
        <Badge variant={lastSource === 'cache' ? 'default' : 'secondary'} className="w-fit">
          {lastSource === 'cache' ? 'Beta Feed' : '公共 Feed 回退'}
        </Badge>
        <h1 className="text-3xl font-bold">{heading}</h1>
        <p className="text-neutral-400">滚动浏览最新与最受欢迎的创意作品，更多个性化排序即将上线。</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const preview = item.creation.previewPatternUri ?? item.creation.patternUri ?? DEFAULT_PLACEHOLDER;
          return (
            <Card
              key={uniqueKey(item)}
              className="border border-neutral-800 bg-neutral-900 text-neutral-100"
              data-feed-score={item.ranking ? item.ranking.score.toFixed(4) : undefined}
            >
              <CardHeader>
                <CardTitle className="line-clamp-2 text-lg font-semibold">{item.creation.summary ?? '创意作品'}</CardTitle>
                <p className="text-sm text-neutral-500">由 {item.creation.userId}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-lg border border-neutral-800">
                  <FirebaseImage
                    src={preview}
                    alt={item.creation.summary ?? item.creation.prompt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                    priority={false}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-400">
                  <span>❤️ {item.creation.likeCount}</span>
                  <span>⭐ {item.creation.favoriteCount}</span>
                  <span>🗣️ {item.creation.commentCount}</span>
                  <span>🔁 {item.creation.shareCount}</span>
                </div>
                {item.rankingSignals ? (
                  <div className="space-y-1 text-xs text-neutral-500">
                    <p className="font-medium text-neutral-300">Ranking Signals</p>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(item.rankingSignals).map(([key, value]) => (
                        <span key={key} className="rounded bg-neutral-800 px-2 py-1">
                          {key}: {value.toFixed(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="mt-10 flex justify-center">
        {hasMore ? (
          <Button onClick={handleLoadMore} disabled={isPending} variant="secondary">
            {isPending ? '加载中…' : '加载更多'}
          </Button>
        ) : (
          <p className="text-sm text-neutral-500">没有更多作品了，敬请期待下一波更新。</p>
        )}
      </div>

      {isPending ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      ) : null}
    </main>
  );
};

export default FeedScreen;
