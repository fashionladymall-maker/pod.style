"use client";

import { useState } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: () => void;
}

interface UseSwipeProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const useSwipe = ({ onSwipeLeft, onSwipeRight }: UseSwipeProps): SwipeHandlers => {
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(0);
    setTouchEndY(0);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const distanceX = touchStartX - touchEndX;
    const distanceY = touchStartY - touchEndY;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      const isSwipeLeft = distanceX > minSwipeDistance;
      const isSwipeRight = distanceX < -minSwipeDistance;

      if (isSwipeLeft && onSwipeLeft) {
        onSwipeLeft();
      } else if (isSwipeRight && onSwipeRight) {
        onSwipeRight();
      }
    }

    setTouchStartX(0);
    setTouchStartY(0);
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};
