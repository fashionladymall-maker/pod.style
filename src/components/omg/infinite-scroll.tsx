"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteScrollProps {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  loader?: React.ReactNode;
}

export function InfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  children,
  className,
  threshold = 200,
  loader,
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;

    const handleIntersection = async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      if (entry.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
        setIsLoadingMore(true);
        try {
          await onLoadMore();
        } catch (error) {
          console.error('Failed to load more:', error);
        } finally {
          setIsLoadingMore(false);
        }
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, onLoadMore, threshold]);

  const defaultLoader = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-8 gap-2"
    >
      <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      <span className="text-sm text-gray-400">加载中...</span>
    </motion.div>
  );

  return (
    <div className={cn('relative', className)}>
      {children}
      
      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="w-full">
          {(isLoading || isLoadingMore) && (loader || defaultLoader)}
        </div>
      )}
      
      {/* End message */}
      {!hasMore && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-8"
        >
          <span className="text-sm text-gray-500">没有更多内容了</span>
        </motion.div>
      )}
    </div>
  );
}

