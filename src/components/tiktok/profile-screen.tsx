"use client";

// @ts-nocheck

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreVertical, Lock, Grid3x3, Heart, Star } from 'lucide-react';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Creation } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProfileScreenProps {
  userId: string;
  userName: string;
  bio?: string;
  creations: Creation[];
  likedCreations: Creation[];
  favoriteCreations: Creation[];
  stats: {
    creationCount: number;
    likeCount: number;
    favoriteCount: number;
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  onBack: () => void;
  onFollow: () => void;
  onMessage: () => void;
  onCreationClick: (creation: Creation) => void;
  onEditProfile?: () => void;
}

export function ProfileScreen({
  userId,
  userName,
  bio,
  creations,
  likedCreations,
  favoriteCreations,
  stats,
  isOwnProfile,
  isFollowing,
  onBack,
  onFollow,
  onMessage,
  onCreationClick,
  onEditProfile,
}: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<'creations' | 'liked' | 'favorites'>('creations');

  const handleTabChange = (value: string) => {
    if (value === 'creations' || value === 'liked' || value === 'favorites') {
      setActiveTab(value);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20" data-profile-user-id={userId}>
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">@{userName}</h1>
          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 个人信息区域 */}
      <div className="px-4 py-6">
        {/* 头像 */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 p-1">
            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-white text-2xl font-bold">
              {userName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* 用户名 */}
        <h2 className="text-center text-xl font-bold mb-2">@{userName}</h2>

        {/* 简介 */}
        {bio && (
          <p className="text-center text-gray-400 text-sm mb-4">{bio}</p>
        )}

        {/* 统计数据 */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <StatItem label="作品" value={stats.creationCount} />
          <StatItem label="点赞" value={stats.likeCount} />
          <StatItem label="收藏" value={stats.favoriteCount} />
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {isOwnProfile ? (
            <Button
              onClick={onEditProfile}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0"
            >
              编辑资料
            </Button>
          ) : (
            <>
              <Button
                onClick={onFollow}
                className={cn(
                  "flex-1",
                  isFollowing
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-gradient-to-r from-pink-500 to-cyan-500 hover:opacity-90 text-white"
                )}
              >
                {isFollowing ? '已关注' : '关注'}
              </Button>
              <Button
                onClick={onMessage}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0"
              >
                消息
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-transparent border-b border-white/10 rounded-none h-12">
          <TabsTrigger
            value="creations"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none"
          >
            <Grid3x3 className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger
            value="liked"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none"
          >
            <Heart className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none"
          >
            <Star className="w-5 h-5" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creations" className="mt-0">
          <CreationGrid creations={creations} onCreationClick={onCreationClick} />
        </TabsContent>

        <TabsContent value="liked" className="mt-0">
          {isOwnProfile ? (
            <CreationGrid creations={likedCreations} onCreationClick={onCreationClick} />
          ) : (
            <PrivateContent />
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-0">
          {isOwnProfile ? (
            <CreationGrid creations={favoriteCreations} onCreationClick={onCreationClick} />
          ) : (
            <PrivateContent />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 统计项组件
function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}

// 创作网格组件
function CreationGrid({
  creations,
  onCreationClick,
}: {
  creations: Creation[];
  onCreationClick: (creation: Creation) => void;
}) {
  if (creations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>还没有作品</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {creations.map((creation) => (
        <motion.button
          key={creation.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => onCreationClick(creation)}
          className="aspect-square relative overflow-hidden bg-gray-900"
        >
          <FirebaseImage
            src={creation.previewPatternUri || creation.patternUri}
            alt={creation.prompt}
            fill
            className="object-cover"
          />
          {/* 悬停遮罩 */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
        </motion.button>
      ))}
    </div>
  );
}

// 私密内容组件
function PrivateContent() {
  return (
    <div className="text-center py-12 text-gray-400">
      <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>此内容为私密</p>
    </div>
  );
}
