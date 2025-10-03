'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface OmgFeedRenderProps {
  index: number;
  isActive: boolean;
  isNearActive: boolean;
  shouldRender: boolean;
}

interface OmgFeedContainerProps<T> {
  items: T[];
  activeIndex: number;
  overscan?: number;
  onActiveIndexChange: (index: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  className?: string;
  renderItem: (item: T, props: OmgFeedRenderProps) => React.ReactNode;
}

const DEFAULT_OVERSCAN = 2;

export function OmgFeedContainer<T>({
  items,
  activeIndex,
  overscan = DEFAULT_OVERSCAN,
  onActiveIndexChange,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  className,
  renderItem,
}: OmgFeedContainerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(activeIndex);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelObserverRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef(new Map<number, HTMLElement>());
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const handleEntries = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      let bestCandidate: { index: number; ratio: number } | null = null;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const indexAttr = (entry.target as HTMLElement).dataset.feedIndex;
        if (typeof indexAttr === 'undefined') continue;
        const index = Number(indexAttr);
        const ratio = entry.intersectionRatio;
        if (!Number.isFinite(index) || Number.isNaN(index)) continue;
        if (!bestCandidate || ratio > bestCandidate.ratio) {
          bestCandidate = { index, ratio };
        }
      }
      if (!bestCandidate) return;
      if (bestCandidate.index !== activeIndexRef.current && bestCandidate.ratio >= 0.55) {
        onActiveIndexChange(bestCandidate.index);
      }
    },
    [onActiveIndexChange],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(handleEntries, {
      root: container,
      threshold: [0.35, 0.55, 0.75, 0.9],
      rootMargin: '0px 0px -10% 0px',
    });
    observerRef.current = observer;

    elementsRef.current.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [handleEntries]);

  const register = useCallback((index: number) => {
    return (node: HTMLElement | null) => {
      const previous = elementsRef.current.get(index);
      if (previous && observerRef.current) {
        observerRef.current.unobserve(previous);
      }

      if (node) {
        node.dataset.feedIndex = index.toString();
        elementsRef.current.set(index, node);
        observerRef.current?.observe(node);
      } else {
        elementsRef.current.delete(index);
      }
    };
  }, []);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const container = containerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;

    if (sentinelObserverRef.current) {
      sentinelObserverRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !entry.isIntersecting || isLoadingMore) return;
        onLoadMore();
      },
      {
        root: container,
        rootMargin: '0px 0px 80px 0px',
        threshold: 0.1,
      },
    );

    observer.observe(sentinel);
    sentinelObserverRef.current = observer;

    return () => {
      observer.disconnect();
      sentinelObserverRef.current = null;
    };
  }, [onLoadMore, hasMore, isLoadingMore]);

  useEffect(() => {
    const observer = observerRef.current;
    const sentinelObserver = sentinelObserverRef.current;
    const elements = elementsRef.current;
    return () => {
      observer?.disconnect();
      sentinelObserver?.disconnect();
      elements.clear();
    };
  }, []);

  const range = useMemo(() => {
    const start = Math.max(0, activeIndex - overscan);
    const end = Math.min(items.length - 1, activeIndex + overscan);
    return { start, end };
  }, [activeIndex, items.length, overscan]);

  return (
    <div ref={containerRef} className={cn('relative h-dvh w-full overflow-hidden bg-neutral-950', className)}>
      <div className="h-full w-full snap-y snap-mandatory overflow-y-auto scroll-smooth">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const isNearActive = Math.abs(index - activeIndex) <= 1;
          const shouldRender = index >= range.start && index <= range.end;
          return (
            <section
              key={index}
              ref={register(index)}
              data-feed-index={index}
              className="relative flex min-h-dvh w-full snap-start items-center justify-center px-4 py-8 md:px-10"
              style={{ minHeight: '100dvh' }}
            >
              {renderItem(item, { index, isActive, isNearActive, shouldRender })}
            </section>
          );
        })}
        <div ref={sentinelRef} className="flex h-24 w-full items-center justify-center text-sm text-neutral-500">
          {hasMore ? (isLoadingMore ? '正在加载更多...' : '继续下滑加载更多') : '已到底部'}
        </div>
      </div>
    </div>
  );
}

export default OmgFeedContainer;
