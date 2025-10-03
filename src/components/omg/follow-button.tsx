"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleFollowAction, isFollowingAction } from '@/features/follows/server/actions';
import { useToast } from '@/hooks/use-toast';

interface FollowButtonProps {
  userId: string;
  targetUserId: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  onLoginRequired?: () => void;
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
}

export function FollowButton({
  userId,
  targetUserId,
  initialIsFollowing = false,
  onFollowChange,
  onLoginRequired,
  variant = 'default',
  className,
}: FollowButtonProps) {
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const loadFollowStatus = useCallback(async () => {
    try {
      const result = await isFollowingAction(userId, targetUserId);
      if (result.success && result.isFollowing !== undefined) {
        setIsFollowing(result.isFollowing);
      }
    } catch (error) {
      console.error('Failed to load follow status:', error);
    }
  }, [targetUserId, userId]);

  // Load initial follow status
  useEffect(() => {
    if (userId && targetUserId && userId !== targetUserId) {
      void loadFollowStatus();
    }
  }, [loadFollowStatus, targetUserId, userId]);

  const handleToggleFollow = async () => {
    // Check if user is logged in
    if (!userId) {
      onLoginRequired?.();
      return;
    }

    // Prevent self-follow
    if (userId === targetUserId) {
      toast({
        title: '无法关注',
        description: '不能关注自己',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await toggleFollowAction({
        followerId: userId,
        followingId: targetUserId,
      });

      if (result.success && result.isFollowing !== undefined) {
        setIsFollowing(result.isFollowing);
        onFollowChange?.(result.isFollowing);

        toast({
          title: result.isFollowing ? '关注成功' : '取消关注',
          description: result.isFollowing ? '你已关注该用户' : '你已取消关注该用户',
          duration: 2000,
        });
      } else {
        throw new Error(result.error || 'Failed to toggle follow');
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button for self
  if (userId === targetUserId) {
    return null;
  }

  // Icon variant
  if (variant === 'icon') {
    return (
      <motion.button
        onClick={handleToggleFollow}
        disabled={isLoading}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
          isFollowing
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            : 'bg-pink-500 text-white',
          isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
        whileTap={{ scale: 0.9 }}
      >
        {isFollowing ? (
          <UserCheck className="w-5 h-5" />
        ) : (
          <UserPlus className="w-5 h-5" />
        )}
      </motion.button>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <motion.button
        onClick={handleToggleFollow}
        disabled={isLoading}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
          isFollowing
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            : 'bg-pink-500 text-white hover:bg-pink-600',
          isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
        whileTap={{ scale: 0.95 }}
      >
        {isLoading ? (
          '...'
        ) : isFollowing ? (
          isHovered ? '取消关注' : '已关注'
        ) : (
          '关注'
        )}
      </motion.button>
    );
  }

  // Default variant
  return (
    <motion.button
      onClick={handleToggleFollow}
      disabled={isLoading}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'px-6 py-2 rounded-full text-base font-medium transition-colors flex items-center gap-2',
        isFollowing
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          : 'bg-pink-500 text-white hover:bg-pink-600',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileTap={{ scale: 0.95 }}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>处理中...</span>
        </>
      ) : (
        <>
          {isFollowing ? (
            <>
              <UserCheck className="w-5 h-5" />
              <span>{isHovered ? '取消关注' : '已关注'}</span>
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              <span>关注</span>
            </>
          )}
        </>
      )}
    </motion.button>
  );
}
