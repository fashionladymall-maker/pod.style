"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { Heart, MessageCircle, Star, Share2, MoreVertical } from 'lucide-react';
import { FirebaseImage } from '@/components/ui/firebase-image';
import type { Creation } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FeedScreenProps {
  creations: Creation[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onLike: (creationId: string) => void;
  onComment: (creationId: string) => void;
  onFavorite: (creationId: string) => void;
  onShare: (creationId: string) => void;
  onUserClick: (userId: string) => void;
}

export function FeedScreen({
  creations,
  currentIndex,
  onIndexChange,
  onLike,
  onComment,
  onFavorite,
  onShare,
  onUserClick,
}: FeedScreenProps) {
  const [direction, setDirection] = useState(0);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentCreation = creations[currentIndex];
  const interactionFlags = currentCreation as Creation & {
    isLiked?: boolean;
    isFavorited?: boolean;
  };
  const isLiked = Boolean(interactionFlags.isLiked);
  const isFavorited = Boolean(interactionFlags.isFavorited);

  // 手势处理
  const bind = useGesture({
    onDrag: ({ movement: [, my], direction: [, dy], cancel }) => {
      // 上滑切换到下一个
      if (my < -50 && dy < 0 && currentIndex < creations.length - 1) {
        setDirection(-1);
        onIndexChange(currentIndex + 1);
        cancel();
      }
      // 下滑切换到上一个
      else if (my > 50 && dy > 0 && currentIndex > 0) {
        setDirection(1);
        onIndexChange(currentIndex - 1);
        cancel();
      }
    },
  });

  // 双击点赞
  const handleDoubleTap = () => {
    if (!isLiked) {
      onLike(currentCreation.id);
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 600);
    }
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        setDirection(1);
        onIndexChange(currentIndex - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < creations.length - 1) {
        setDirection(-1);
        onIndexChange(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, creations.length, onIndexChange]);

  if (!currentCreation) return null;

  return (
    <div
      ref={containerRef}
      {...bind()}
      className="relative h-screen w-full bg-black overflow-hidden touch-none"
      onDoubleClick={handleDoubleTap}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentCreation.id}
          custom={direction}
          initial={{ y: direction > 0 ? '-100%' : '100%' }}
          animate={{ y: 0 }}
          exit={{ y: direction > 0 ? '100%' : '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute inset-0"
        >
          {/* 背景图片 */}
          <div className="absolute inset-0">
            <FirebaseImage
              src={currentCreation.previewPatternUri || currentCreation.patternUri}
              alt={currentCreation.prompt}
              fill
              className="object-cover"
              priority
            />
            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
          </div>

          {/* 双击点赞动画 */}
          <AnimatePresence>
            {isLikeAnimating && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="w-32 h-32 text-white fill-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 右侧交互按钮 */}
          <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
            {/* 用户头像 */}
            <button
              onClick={() => onUserClick(currentCreation.userId)}
              className="relative"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 p-0.5">
                <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-white font-semibold">
                  {currentCreation.userId.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">+</span>
              </div>
            </button>

            {/* 点赞按钮 */}
            <ActionButton
              icon={Heart}
              count={currentCreation.likeCount}
              active={isLiked}
              onClick={() => onLike(currentCreation.id)}
            />

            {/* 评论按钮 */}
            <ActionButton
              icon={MessageCircle}
              count={currentCreation.commentCount}
              onClick={() => onComment(currentCreation.id)}
            />

            {/* 收藏按钮 */}
            <ActionButton
              icon={Star}
              count={currentCreation.favoriteCount}
              active={isFavorited}
              onClick={() => onFavorite(currentCreation.id)}
            />

            {/* 分享按钮 */}
            <ActionButton
              icon={Share2}
              count={currentCreation.shareCount}
              onClick={() => onShare(currentCreation.id)}
            />

            {/* 更多按钮 */}
            <ActionButton
              icon={MoreVertical}
              onClick={() => {}}
            />
          </div>

          {/* 底部信息栏 */}
          <div className="absolute bottom-20 left-0 right-0 px-4 pb-4">
            <div className="space-y-2">
              {/* 用户名 */}
              <button
                onClick={() => onUserClick(currentCreation.userId)}
                className="text-white font-semibold text-base flex items-center gap-2"
              >
                @{currentCreation.userId.slice(0, 8)}
                <span className="px-3 py-1 border border-white/50 rounded-full text-xs">
                  关注
                </span>
              </button>

              {/* 描述 */}
              <p className="text-white text-sm line-clamp-2">
                {currentCreation.prompt}
              </p>

              {/* 风格标签 */}
              {currentCreation.style && (
                <div className="flex items-center gap-2 text-white/80 text-xs">
                  <span>🎨</span>
                  <span>{currentCreation.style}</span>
                </div>
              )}

              {/* 摘要标签 */}
              {currentCreation.summary && (
                <div className="flex items-center gap-1">
                  <span className="text-white/80 text-xs">#{currentCreation.summary}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 进度指示器 */}
      <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4">
        {creations.map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-0.5 flex-1 rounded-full transition-all duration-300",
              index === currentIndex ? "bg-white" : "bg-white/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// 交互按钮组件
function ActionButton({
  icon: Icon,
  count,
  active = false,
  onClick,
}: {
  icon: React.ElementType;
  count?: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1"
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
          active
            ? "bg-pink-500 text-white"
            : "bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
        )}
      >
        <Icon className={cn("w-6 h-6", active && "fill-current")} />
      </div>
      {count !== undefined && count > 0 && (
        <span className="text-white text-xs font-medium">
          {count > 999 ? `${(count / 1000).toFixed(1)}K` : count}
        </span>
      )}
    </motion.button>
  );
}
