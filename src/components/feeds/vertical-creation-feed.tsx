"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Creation } from "@/lib/types";
import { IMAGE_PLACEHOLDER } from "@/lib/image-placeholders";
import { Bookmark, Heart, Share2, Sparkles } from "lucide-react";

interface VerticalCreationFeedProps {
  creations: Creation[];
  visibleCount: number;
  onSelect: (creation: Creation, modelIndex?: number) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

interface FeedItem {
  creation: Creation;
  imageUrl: string;
  altText: string;
  modelIndex: number;
}

const getFeedItems = (creations: Creation[]): FeedItem[] => {
  return creations.map((creation) => {
    const visibleModels = creation.models
      .map((model, index) => ({ model, index }))
      .filter(({ model }) => model?.isPublic !== false);

    const latestEntry = visibleModels.length > 0 ? visibleModels[visibleModels.length - 1] : null;
    const imageUrl = latestEntry
      ? latestEntry.model.previewUri || latestEntry.model.uri
      : creation.previewPatternUri || creation.patternUri;

    const altText = latestEntry ? `商品: ${latestEntry.model.category}` : `创意: ${creation.prompt}`;
    const modelIndex = latestEntry ? latestEntry.index : -1;

    return {
      creation,
      imageUrl,
      altText,
      modelIndex,
    };
  });
};

const VerticalCreationFeed: React.FC<VerticalCreationFeedProps> = ({
  creations,
  visibleCount,
  onSelect,
  onLoadMore,
  hasMore,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const feedItems = useMemo(() => getFeedItems(creations.slice(0, visibleCount)), [creations, visibleCount]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const cards = Array.from(container.querySelectorAll<HTMLDivElement>("[data-feed-item]"));

    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries
          .filter((item) => item.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (entry) {
          const index = Number((entry.target as HTMLElement).dataset.index ?? 0);
          setActiveIndex(index);
        }
      },
      {
        root: container,
        threshold: [0.5, 0.75, 0.9],
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [feedItems.length]);

  useEffect(() => {
    if (!sentinelRef.current || !containerRef.current || !hasMore) {
      return;
    }

    const sentinel = sentinelRef.current;
    const container = containerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, onLoadMore, feedItems.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [creations]);

  const handleSelect = useCallback(
    (item: FeedItem) => {
      onSelect(item.creation, item.modelIndex === undefined ? -1 : item.modelIndex);
    },
    [onSelect]
  );

  if (!isLoading && feedItems.length === 0) {
    return (
      <div className="rounded-3xl border bg-secondary/40 text-secondary-foreground p-6 text-center">
        <p className="font-medium">暂时没有可浏览的作品</p>
        <p className="text-sm text-secondary-foreground/80 mt-1">稍后再来探索更多灵感吧。</p>
      </div>
    );
  }

  if (isLoading && feedItems.length === 0) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[60vh] min-h-[420px] rounded-[28px] bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl border bg-background shadow-sm">
      <div
        ref={containerRef}
        className="h-[78vh] max-h-[760px] overflow-y-auto rounded-3xl scroll-smooth snap-y snap-mandatory bg-black/90"
      >
        <div className="relative flex flex-col gap-6 py-6 px-4">
          {feedItems.map((item, index) => (
            <div
              key={`${item.creation.id}-${item.modelIndex}`}
              data-feed-item
              data-index={index}
              className="relative snap-start"
            >
              <button
                onClick={() => handleSelect(item)}
                className="group relative block w-full overflow-hidden rounded-[28px] bg-black"
                aria-label={`查看 ${item.creation.prompt}`}
              >
                <div className="relative h-[72vh] min-h-[520px] w-full">
                  <Image
                    src={item.imageUrl}
                    alt={item.altText}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 600px"
                    placeholder="blur"
                    blurDataURL={IMAGE_PLACEHOLDER}
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80 transition-all duration-500 group-hover:opacity-90" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 text-left text-white">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
                      <Sparkles size={14} />
                      <span>灵感推荐</span>
                    </div>
                    <p className="text-lg font-semibold leading-tight line-clamp-3">
                      {item.creation.prompt}
                    </p>
                    <div className="flex items-center gap-5 text-sm text-white/80">
                      <span className="flex items-center gap-1">
                        <Heart size={16} /> {item.creation.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark size={16} /> {item.creation.favoriteCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 size={16} /> {item.creation.shareCount}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="h-10 w-full" aria-hidden="true" />
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs text-white/80 backdrop-blur">
          <span>向上/向下滑动查看更多灵感</span>
        </div>
      </div>

      {feedItems.length > 0 && (
        <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {feedItems.map((_, index) => (
            <span
              key={index}
              className={`h-2 w-2 rounded-full transition-all ${index === activeIndex ? "scale-125 bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VerticalCreationFeed;
