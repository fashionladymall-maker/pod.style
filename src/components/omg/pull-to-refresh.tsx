"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only trigger if scrolled to top
    if (container.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || startY === 0) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0) {
      // Prevent default scroll behavior
      e.preventDefault();
      
      // Apply resistance
      const resistance = 0.5;
      const adjustedDistance = Math.min(distance * resistance, threshold * 1.5);
      setPullDistance(adjustedDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setStartY(0);
      }
    } else {
      setPullDistance(0);
      setStartY(0);
    }
  };

  const getRefreshIcon = () => {
    if (isRefreshing) {
      return <Loader2 className="w-6 h-6 animate-spin text-pink-500" />;
    }
    
    const rotation = Math.min((pullDistance / threshold) * 360, 360);
    return (
      <RefreshCw
        className={cn(
          'w-6 h-6 transition-colors',
          pullDistance >= threshold ? 'text-pink-500' : 'text-gray-400'
        )}
        style={{ transform: `rotate(${rotation}deg)` }}
      />
    );
  };

  const getRefreshText = () => {
    if (isRefreshing) return '刷新中...';
    if (pullDistance >= threshold) return '松开刷新';
    if (pullDistance > 0) return '下拉刷新';
    return '';
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-y-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center z-50"
            style={{
              height: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
            }}
          >
            <div className="flex flex-col items-center gap-2">
              {getRefreshIcon()}
              <span className="text-sm text-gray-400">{getRefreshText()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

