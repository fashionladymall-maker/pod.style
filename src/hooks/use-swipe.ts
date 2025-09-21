
"use client";

import { useState, useRef } from 'react';

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

export const useSwipe = ({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown }: UseSwipeProps): SwipeHandlers => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isSwipingRef.current = true;
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwipingRef.current || !touchStartRef.current) return;

    const touchCurrentX = e.targetTouches[0].clientX;
    const touchCurrentY = e.targetTouches[0].clientY;

    const deltaX = touchCurrentX - touchStartRef.current.x;
    const deltaY = touchCurrentY - touchStartRef.current.y;

    // Prioritize vertical swipe and prevent default browser scroll
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwipingRef.current || !touchStartRef.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartRef.current.x;
    const deltaY = touchEndY - touchStartRef.current.y;

    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        if (deltaY < -minSwipeDistance && onSwipeUp) {
          onSwipeUp();
        } else if (deltaY > minSwipeDistance && onSwipeDown) {
          onSwipeDown();
        }
      } else {
        // Horizontal swipe
        if (deltaX < -minSwipeDistance && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX > minSwipeDistance && onSwipeRight) {
          onSwipeRight();
        }
      }
    }
    
    isSwipingRef.current = false;
    touchStartRef.current = null;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};
