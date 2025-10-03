"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FollowButton } from './follow-button';
import { getFollowingAction, getFollowersAction } from '@/features/follows/server/actions';
import type { Follow } from '@/lib/types';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholders';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentUserId: string | null;
  type: 'following' | 'followers';
  onLoginRequired?: () => void;
}

export function FollowListModal({
  isOpen,
  onClose,
  userId,
  currentUserId,
  type,
  onLoginRequired,
}: FollowListModalProps) {
  const [follows, setFollows] = useState<Follow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadFollows = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = type === 'following'
        ? await getFollowingAction(userId, page)
        : await getFollowersAction(userId, page);

      if (result.success && 'follows' in result) {
        setFollows((prev) => (page === 1 ? result.follows : [...prev, ...result.follows]));
        setHasMore(Boolean(result.hasMore));
      }
    } catch (error) {
      console.error('Failed to load follows:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, type, userId]);

  useEffect(() => {
    if (isOpen) {
      void loadFollows();
    } else {
      // Reset when closed
      setFollows([]);
      setPage(1);
      setHasMore(false);
    }
  }, [isOpen, loadFollows]);

  const handleFollowChange = () => {
    // Update local state if needed
    // For now, we'll just reload the list
    void loadFollows();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold">
                {type === 'following' ? '关注' : '粉丝'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <ScrollArea className="h-[60vh]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : follows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <User className="w-12 h-12 mb-2 opacity-50" />
                  <p>
                    {type === 'following' ? '还没有关注任何人' : '还没有粉丝'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {follows.map((follow) => {
                    const displayUser = type === 'following'
                      ? {
                          id: follow.followingId,
                          name: follow.followingName,
                          avatar: follow.followingAvatar,
                        }
                      : {
                          id: follow.followerId,
                          name: follow.followerName,
                          avatar: follow.followerAvatar,
                        };

                    return (
                      <motion.div
                        key={follow.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                            {displayUser.avatar ? (
                              <FirebaseImage
                                src={displayUser.avatar}
                                alt={displayUser.name}
                                fill
                                className="rounded-full object-cover"
                                placeholder="blur"
                                blurDataURL={IMAGE_PLACEHOLDER}
                              />
                            ) : (
                              displayUser.name.charAt(0).toUpperCase()
                            )}
                          </div>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {displayUser.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              @{displayUser.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>

                        {/* Follow Button */}
                        {currentUserId && (
                          <FollowButton
                            userId={currentUserId}
                            targetUserId={displayUser.id}
                            variant="compact"
                            onFollowChange={handleFollowChange}
                            onLoginRequired={onLoginRequired}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Load More */}
              {hasMore && !isLoading && (
                <div className="p-4">
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    className="w-full py-2 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                  >
                    加载更多
                  </button>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
