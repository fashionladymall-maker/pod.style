"use client";

// @ts-nocheck

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MoreVertical,
  Lock,
  Grid3x3,
  Heart,
  Star,
  ShoppingBag,
  LogOut,
  Settings,
  LogIn
} from 'lucide-react';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FollowButton } from './follow-button';
import type { Creation, Order } from '@/lib/types';
import { cn } from '@/lib/utils';

const FollowListModal = dynamic(
  () => import('./follow-list-modal').then((mod) => mod.FollowListModal),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 text-sm text-gray-300">
        加载关注列表...
      </div>
    ),
  },
);

interface ProfileScreenProps {
  userId: string | null;
  currentUserId: string | null;
  userName: string;
  bio?: string;
  creations: Creation[];
  likedCreations: Creation[];
  favoriteCreations: Creation[];
  orders?: Order[];
  stats: {
    creationCount: number;
    likeCount: number;
    favoriteCount: number;
    followingCount?: number;
    followersCount?: number;
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  isAuthenticated: boolean;
  onBack: () => void;
  onFollow: () => void;
  onMessage: () => void;
  onCreationClick: (creation: Creation) => void;
  onOrderClick?: (order: Order) => void;
  onEditProfile?: () => void;
  onLogin?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
  onLoginRequired?: () => void;
}

export function ProfileScreen({
  userId,
  currentUserId,
  userName,
  bio,
  creations,
  likedCreations,
  favoriteCreations,
  orders = [],
  stats,
  isOwnProfile,
  isFollowing,
  isAuthenticated,
  onBack,
  onFollow,
  onMessage,
  onCreationClick,
  onOrderClick,
  onEditProfile,
  onLogin,
  onLogout,
  onSettings,
  onLoginRequired,
}: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<'creations' | 'liked' | 'favorites' | 'orders'>('creations');
  const [showFollowListModal, setShowFollowListModal] = useState(false);
  const [followListType, setFollowListType] = useState<'following' | 'followers'>('following');

  const handleTabChange = (value: string) => {
    if (value === 'creations' || value === 'liked' || value === 'favorites' || value === 'orders') {
      setActiveTab(value);
    }
  };

  // 如果未登录，显示登录提示
  if (!isAuthenticated || !userId) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center">
            <LogIn className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold">登录以查看个人资料</h2>
          <p className="text-gray-400">
            登录后可以查看你的创作、订单和收藏
          </p>
          <Button
            onClick={onLogin}
            className="w-full h-12 bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white font-semibold"
          >
            立即登录
          </Button>
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full text-gray-400 hover:text-white"
          >
            返回
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-center gap-6 mb-6">
          <button
            onClick={() => {
              setFollowListType('following');
              setShowFollowListModal(true);
            }}
            className="text-center hover:opacity-80 transition-opacity"
          >
            <div className="text-xl font-bold">{stats.followingCount || 0}</div>
            <div className="text-gray-400 text-sm">关注</div>
          </button>

          <button
            onClick={() => {
              setFollowListType('followers');
              setShowFollowListModal(true);
            }}
            className="text-center hover:opacity-80 transition-opacity"
          >
            <div className="text-xl font-bold">{stats.followersCount || 0}</div>
            <div className="text-gray-400 text-sm">粉丝</div>
          </button>

          <StatItem label="作品" value={stats.creationCount} />
          <StatItem label="点赞" value={stats.likeCount} />
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
              {currentUserId && userId && (
                <FollowButton
                  userId={currentUserId}
                  targetUserId={userId}
                  initialIsFollowing={isFollowing}
                  onFollowChange={onFollow}
                  onLoginRequired={onLoginRequired}
                  variant="default"
                  className="flex-1"
                />
              )}
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
        <TabsList className="w-full grid grid-cols-4 bg-transparent border-b border-white/10 rounded-none h-12">
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
          {isOwnProfile && (
            <TabsTrigger
              value="orders"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none"
            >
              <ShoppingBag className="w-5 h-5" />
            </TabsTrigger>
          )}
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

        {isOwnProfile && (
          <TabsContent value="orders" className="mt-0">
            <OrderList orders={orders} onOrderClick={onOrderClick} />
          </TabsContent>
        )}
      </Tabs>

      {/* 设置和退出登录按钮 */}
      {isOwnProfile && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
          <div className="flex gap-2">
            {onSettings && (
              <Button
                onClick={onSettings}
                variant="outline"
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                设置
              </Button>
            )}
            {onLogout && (
              <Button
                onClick={onLogout}
                variant="outline"
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 关注/粉丝列表弹窗 */}
      {userId && (
        <FollowListModal
          isOpen={showFollowListModal}
          onClose={() => setShowFollowListModal(false)}
          userId={userId}
          currentUserId={currentUserId}
          type={followListType}
          onLoginRequired={onLoginRequired}
        />
      )}
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

// 订单列表组件
function OrderList({
  orders,
  onOrderClick,
}: {
  orders: Order[];
  onOrderClick?: (order: Order) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>还没有订单</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/10">
      {orders.map((order) => (
        <motion.button
          key={order.id}
          whileTap={{ scale: 0.98 }}
          onClick={() => onOrderClick?.(order)}
          className="w-full p-4 text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex gap-3">
            {/* 订单商品图片 */}
            {(() => {
              const previewUri: string = order.items?.[0]?.modelUri ?? order.modelUri ?? '';
              if (!previewUri) {
                return null;
              }

              return (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-900 flex-shrink-0">
                  <FirebaseImage
                    src={previewUri}
                    alt="商品"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
              );
            })()}

            {/* 订单信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">
                  订单 #{order.id.slice(0, 8)}
                </span>
                <span className="text-sm text-gray-400">
                  ${order.price?.toFixed(2) || '29.99'}
                </span>
              </div>
              <p className="text-sm text-gray-400 truncate">
                {order.items?.length || 0} 件商品
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(order.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
