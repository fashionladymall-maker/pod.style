"use client";

// @ts-nocheck

import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FeedScreen } from './feed-screen';
import { BottomNav, type NavTab } from './bottom-nav';
import { CommentDrawer } from './comment-drawer';
import { ProfileScreen } from './profile-screen';
import type { Creation } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type InteractiveCreation = Creation & {
  isLiked?: boolean;
  isFavorited?: boolean;
};

interface TikTokAppProps {
  initialCreations: Creation[];
  userId: string;
  onGenerateClick: () => void;
}

export function TikTokApp({ initialCreations, userId, onGenerateClick }: TikTokAppProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [creations, setCreations] = useState<InteractiveCreation[]>(
    initialCreations.map((creation) => ({ ...creation })),
  );
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [selectedCreationId, setSelectedCreationId] = useState<string | null>(null);

  // 点赞
  const handleLike = useCallback((creationId: string) => {
    setCreations((prev) =>
      prev.map((c) => {
        if (c.id === creationId) {
          const liked = Boolean(c.isLiked);
          return {
            ...c,
            isLiked: !liked,
            likeCount: liked ? c.likeCount - 1 : c.likeCount + 1,
          };
        }
        return c;
      }),
    );

    const target = creations.find((c) => c.id === creationId) as InteractiveCreation | undefined;
    toast({
      title: target?.isLiked ? '取消点赞' : '点赞成功',
      duration: 1000,
    });
  }, [creations, toast]);

  // 评论
  const handleComment = useCallback((creationId: string) => {
    setSelectedCreationId(creationId);
    setIsCommentDrawerOpen(true);
  }, []);

  // 收藏
  const handleFavorite = useCallback((creationId: string) => {
    setCreations((prev) =>
      prev.map((c) => {
        if (c.id === creationId) {
          const favorited = Boolean(c.isFavorited);
          return {
            ...c,
            isFavorited: !favorited,
            favoriteCount: favorited ? c.favoriteCount - 1 : c.favoriteCount + 1,
          };
        }
        return c;
      }),
    );

    const target = creations.find((c) => c.id === creationId) as InteractiveCreation | undefined;
    toast({
      title: target?.isFavorited ? '取消收藏' : '收藏成功',
      duration: 1000,
    });
  }, [creations, toast]);

  // 分享
  const handleShare = useCallback((creationId: string) => {
    const creation = creations.find(c => c.id === creationId);
    if (creation) {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(`${window.location.origin}/creation/${creationId}`);
      toast({
        title: '链接已复制',
        description: '可以分享给朋友了',
        duration: 2000,
      });
    }
  }, [creations, toast]);

  // 用户点击
  const handleUserClick = useCallback((userId: string) => {
    setActiveTab('profile');
  }, []);

  // 添加评论
  const handleAddComment = useCallback((content: string) => {
    toast({
      title: '评论成功',
      duration: 1000,
    });
    // TODO: 实际的评论逻辑
  }, [toast]);

  // 点赞评论
  const handleLikeComment = useCallback((commentId: string) => {
    // TODO: 实际的点赞评论逻辑
  }, []);

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <FeedScreen
              creations={creations}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              onLike={handleLike}
              onComment={handleComment}
              onFavorite={handleFavorite}
              onShare={handleShare}
              onUserClick={handleUserClick}
            />
          </motion.div>
        )}

        {activeTab === 'discover' && (
          <motion.div
            key="discover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold mb-2">发现</h2>
              <p className="text-gray-400">探索更多精彩内容</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'inbox' && (
          <motion.div
            key="inbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold mb-2">消息</h2>
              <p className="text-gray-400">暂无新消息</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0"
          >
            <ProfileScreen
              userId={userId}
              userName={userId.slice(0, 8)}
              bio="热爱创作，分享美好"
              creations={creations.filter((c) => c.userId === userId)}
              likedCreations={creations.filter((c) => Boolean(c.isLiked))}
              favoriteCreations={creations.filter((c) => Boolean(c.isFavorited))}
              stats={{
                creationCount: creations.filter((c) => c.userId === userId).length,
                likeCount: creations.reduce((sum, c) => sum + c.likeCount, 0),
                favoriteCount: creations.reduce((sum, c) => sum + c.favoriteCount, 0),
              }}
              isOwnProfile={true}
              isFollowing={false}
              onBack={() => setActiveTab('home')}
              onFollow={() => {}}
              onMessage={() => {}}
              onCreationClick={(creation) => {
                const index = creations.findIndex(c => c.id === creation.id);
                if (index !== -1) {
                  setCurrentIndex(index);
                  setActiveTab('home');
                }
              }}
              onEditProfile={() => {
                toast({
                  title: '编辑资料',
                  description: '功能开发中...',
                });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部导航栏 */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreateClick={onGenerateClick}
      />

      {/* 评论抽屉 */}
      <CommentDrawer
        isOpen={isCommentDrawerOpen}
        onClose={() => setIsCommentDrawerOpen(false)}
        comments={[]}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
      />
    </div>
  );
}
