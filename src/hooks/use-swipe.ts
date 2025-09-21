
"use client";

import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
}

interface UseSwipeProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

const minSwipeDistance = 50;
const swipeCooldown = 300; // 300ms cooldown

export const useSwipe = ({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown }: UseSwipeProps): SwipeHandlers => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastSwipeTimeRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;

    const touchCurrentX = e.targetTouches[0].clientX;
    const touchCurrentY = e.targetTouches[0].clientY;

    const deltaX = touchCurrentX - touchStartRef.current.x;
    const deltaY = touchCurrentY - touchStartRef.current.y;

    // If vertical movement is dominant, prevent default browser scrolling.
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;

    const now = Date.now();
    if (now - lastSwipeTimeRef.current < swipeCooldown) {
      touchStartRef.current = null;
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartRef.current.x;
    const deltaY = touchEndY - touchStartRef.current.y;

    touchStartRef.current = null;

    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        if (deltaY < -minSwipeDistance && onSwipeUp) {
          onSwipeUp();
          lastSwipeTimeRef.current = now;
        } else if (deltaY > minSwipeDistance && onSwipeDown) {
          onSwipeDown();
          lastSwipeTimeRef.current = now;
        }
      } else {
        // Horizontal swipe
        if (deltaX < -minSwipeDistance && onSwipeLeft) {
          onSwipeLeft();
          lastSwipeTimeRef.current = now;
        } else if (deltaX > minSwipeDistance && onSwipeRight) {
          onSwipeRight();
          lastSwipeTimeRef.current = now;
        }
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};
