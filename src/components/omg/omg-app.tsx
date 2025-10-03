"use client";

// @ts-nocheck

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { FeedScreen } from './feed-screen';
import { BottomNav, type NavTab } from './bottom-nav';
import { DiscoverScreen } from './discover-screen';
import type { Creation, Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { logCustomPerformanceMetric } from '@/lib/performance/web-vitals';
import {
  generatePatternAction,
  generateModelAction,
  toggleLikeAction,
  toggleFavoriteAction,
  incrementShareCountAction,
  getCreationsAction,
  getOrdersAction,
  createOrderAction,
  getPublicCreationsAction,
} from '@/server/actions';
import { updateUserProfileAction } from '@/features/users/server/actions';
import { addHashtagsToCreationAction } from '@/features/hashtags/server/actions';
import { recordViewAction } from '@/features/history/server/actions';

const CommentDrawer = dynamic(
  () => import('./comment-drawer').then((mod) => mod.CommentDrawer),
  { ssr: false, loading: () => null },
);

const ProfileScreen = dynamic(
  () => import('./profile-screen').then((mod) => mod.ProfileScreen),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-gray-400">
        加载个人主页...
      </div>
    ),
  },
);

const CreateScreen = dynamic(
  () => import('./create-screen').then((mod) => mod.CreateScreen),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-gray-400">
        准备创作工作室...
      </div>
    ),
  },
);

const LoginModal = dynamic(
  () => import('./login-modal').then((mod) => mod.LoginModal),
  { ssr: false, loading: () => null },
);

const CategorySelector = dynamic(
  () => import('./category-selector').then((mod) => mod.CategorySelector),
  { ssr: false, loading: () => null },
);

const ProductDetailModal = dynamic(
  () => import('./product-detail-modal').then((mod) => mod.ProductDetailModal),
  { ssr: false, loading: () => null },
);

const CheckoutFlow = dynamic(
  () => import('./checkout-flow').then((mod) => mod.CheckoutFlow),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-gray-400">
        正在加载结算流程...
      </div>
    ),
  },
);

const InboxScreen = dynamic(
  () => import('./inbox-screen').then((mod) => mod.InboxScreen),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-gray-400">
        正在加载通知...
      </div>
    ),
  },
);

const OrderDetailModal = dynamic(
  () => import('./order-detail-modal').then((mod) => mod.OrderDetailModal),
  { ssr: false, loading: () => null },
);

const SettingsScreen = dynamic(
  () => import('./settings-screen').then((mod) => mod.SettingsScreen),
  { ssr: false, loading: () => null },
);

const EditProfileScreen = dynamic(
  () => import('./edit-profile-screen').then((mod) => mod.EditProfileScreen),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-gray-400">
        正在载入资料编辑...
      </div>
    ),
  },
);

const SearchScreen = dynamic(
  () => import('./search-screen').then((mod) => mod.SearchScreen),
  { ssr: false, loading: () => null },
);

const HistoryScreen = dynamic(
  () => import('./history-screen').then((mod) => mod.HistoryScreen),
  { ssr: false, loading: () => null },
);

type InteractiveCreation = Creation & {
  isLiked?: boolean;
  isFavorited?: boolean;
};

interface OMGAppProps {
  initialCreations: Creation[];
  userId: string | null;
  isAuthenticated: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export function OMGApp({
  initialCreations,
  userId,
  isAuthenticated,
  onLogin,
  onRegister,
  onLogout,
}: OMGAppProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [creations, setCreations] = useState<InteractiveCreation[]>(
    initialCreations.map((creation) => ({ ...creation })),
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [selectedCreationId, setSelectedCreationId] = useState<string | null>(null);
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedCreationForProduct, setSelectedCreationForProduct] = useState<Creation | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<{
    name: string;
    price: number;
    size?: string;
  } | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [userName, setUserName] = useState(userId ? userId.slice(0, 8) : 'Guest');
  const [userBio, setUserBio] = useState('热爱创作，分享美好');
  const [userAvatar, setUserAvatar] = useState<string | undefined>(undefined);
  const [hasMoreCreations, setHasMoreCreations] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 加载用户数据
  useEffect(() => {
    if (userId && isAuthenticated) {
      loadUserData();
    }
  }, [userId, isAuthenticated]);

  // 记录浏览历史
  useEffect(() => {
    if (userId && creations[currentIndex] && activeTab === 'home') {
      const creation = creations[currentIndex];
      recordViewAction(userId, creation.id).catch(error => {
        console.error('Failed to record view:', error);
      });
    }
  }, [currentIndex, userId, activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const preloadModules = () => {
      void Promise.all([
        import('./profile-screen'),
        import('./create-screen'),
        import('./comment-drawer'),
        import('./inbox-screen'),
        import('./checkout-flow'),
      ]);
    };

    if ('requestIdleCallback' in window) {
      const idleHandle = (window as any).requestIdleCallback(preloadModules);
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(idleHandle);
        }
      };
    }

    const timeoutId = setTimeout(preloadModules, 1200);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (activeTab === 'profile') {
      void import('./profile-screen');
    }
    if (activeTab === 'inbox') {
      void import('./inbox-screen');
    }
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      const [userCreations, userOrders] = await Promise.all([
        getCreationsAction(userId!),
        getOrdersAction(userId!),
      ]);

      const creationIds = new Set(creations.map(c => c.id));
      const newCreations = userCreations.filter(c => !creationIds.has(c.id));
      if (newCreations.length > 0) {
        setCreations(prev => [...newCreations, ...prev]);
      }

      setOrders(userOrders);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // 生成图案
  const handleGeneratePattern = async (prompt: string, style: string, referenceImage: string | null, hashtags?: string) => {
    if (!userId) {
      toast({
        title: '请先登录',
        description: '登录后即可开始创作',
        variant: 'destructive',
      });
      setShowLoginModal(true);
      return;
    }

    setIsGenerating(true);
    const metricStart = typeof performance !== 'undefined' ? performance.now() : null;
    let generationStatus: 'success' | 'error' = 'success';
    let failureReason: string | undefined;
    try {
      const newCreation = await generatePatternAction({
        userId,
        prompt,
        style,
        referenceImage,
      });

      // Add hashtags if provided
      if (hashtags && hashtags.trim()) {
        try {
          await addHashtagsToCreationAction(newCreation.id, userId, hashtags);
        } catch (error) {
          console.error('Failed to add hashtags:', error);
        }
      }

      setCreations(prev => [newCreation, ...prev]);
      setShowCreateScreen(false);
      setCurrentIndex(0);
      setActiveTab('home');

      toast({
        title: '创作成功！',
        description: '你的图案已生成',
      });
    } catch (error: any) {
      generationStatus = 'error';
      failureReason = error?.message || error?.code || 'unknown-error';
      toast({
        title: '生成失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      if (metricStart !== null) {
        const duration = Math.max(performance.now() - metricStart, 0);
        const attributes: Record<string, string | number> = {
          status: generationStatus,
          hasReference: referenceImage ? 'true' : 'false',
          promptLength: prompt.length,
        };
        if (failureReason) {
          attributes.error = failureReason.slice(0, 120);
        }
        logCustomPerformanceMetric('pattern_generation_ms', duration, attributes);
      }
    }
  };

  // 点赞
  const handleLike = useCallback(async (creationId: string) => {
    if (!userId) {
      toast({ title: '请先登录', variant: 'destructive' });
      return;
    }

    const creation = creations.find(c => c.id === creationId);
    const isLiked = creation?.isLiked || false;

    setCreations((prev) =>
      prev.map((c) => {
        if (c.id === creationId) {
          return {
            ...c,
            isLiked: !isLiked,
            likeCount: isLiked ? c.likeCount - 1 : c.likeCount + 1,
          };
        }
        return c;
      }),
    );

    try {
      await toggleLikeAction(creationId, userId, !isLiked);
    } catch (error) {
      setCreations((prev) =>
        prev.map((c) => {
          if (c.id === creationId) {
            return {
              ...c,
              isLiked: isLiked,
              likeCount: isLiked ? c.likeCount + 1 : c.likeCount - 1,
            };
          }
          return c;
        }),
      );
      toast({ title: '操作失败', variant: 'destructive' });
    }
  }, [creations, userId, toast]);

  // 收藏
  const handleFavorite = useCallback(async (creationId: string) => {
    if (!userId) {
      toast({ title: '请先登录', variant: 'destructive' });
      return;
    }

    const creation = creations.find(c => c.id === creationId);
    const isFavorited = creation?.isFavorited || false;

    setCreations((prev) =>
      prev.map((c) => {
        if (c.id === creationId) {
          return {
            ...c,
            isFavorited: !isFavorited,
            favoriteCount: isFavorited ? c.favoriteCount - 1 : c.favoriteCount + 1,
          };
        }
        return c;
      }),
    );

    try {
      await toggleFavoriteAction(creationId, userId, !isFavorited);
    } catch (error) {
      setCreations((prev) =>
        prev.map((c) => {
          if (c.id === creationId) {
            return {
              ...c,
              isFavorited: isFavorited,
              favoriteCount: isFavorited ? c.favoriteCount + 1 : c.favoriteCount - 1,
            };
          }
          return c;
        }),
      );
      toast({ title: '操作失败', variant: 'destructive' });
    }
  }, [creations, userId, toast]);

  // 评论
  const handleComment = useCallback((creationId: string) => {
    setSelectedCreationId(creationId);
    setIsCommentDrawerOpen(true);
  }, []);

  // 打开登录弹窗
  const handleOpenLogin = useCallback(() => {
    void import('./login-modal');
    setShowLoginModal(true);
  }, []);

  // 分享
  const handleShare = useCallback(async (creationId: string) => {
    try {
      await incrementShareCountAction(creationId);
      await navigator.clipboard.writeText(`${window.location.origin}/creation/${creationId}`);
      toast({
        title: '链接已复制',
        description: '可以分享给朋友了',
      });
    } catch (error) {
      toast({ title: '分享失败', variant: 'destructive' });
    }
  }, [toast]);

  // 用户点击
  const handleUserClick = useCallback(() => {
    void import('./profile-screen');
    setActiveTab('profile');
  }, []);

  // 创作按钮点击
  const handleCreateClick = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    void import('./create-screen');
    setShowCreateScreen(true);
  };



  // 订单点击
  const handleOrderClick = (order: Order) => {
    void import('./order-detail-modal');
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  // 生成商品
  const handleGenerateModel = async (category: string) => {
    if (!userId) {
      toast({
        title: '请先登录',
        variant: 'destructive',
      });
      setShowLoginModal(true);
      return;
    }

    if (!selectedCreationForProduct) return;

    setIsGenerating(true);
    setShowCategorySelector(false);
    const metricStart = typeof performance !== 'undefined' ? performance.now() : null;
    let generationStatus: 'success' | 'error' = 'success';
    let failureReason: string | undefined;

    try {
      const updatedCreation = await generateModelAction({
        creationId: selectedCreationForProduct.id,
        userId,
        patternDataUri: selectedCreationForProduct.patternUri,
        category,
        colorName: 'Default',
      });

      // 更新创作列表
      setCreations(prev =>
        prev.map(c => c.id === updatedCreation.id ? updatedCreation : c)
      );

      toast({
        title: '商品生成成功！',
        description: '可以在个人中心查看',
      });

      // 打开商品详情
      setSelectedCreationForProduct(updatedCreation);
      setSelectedModelIndex(updatedCreation.models.length - 1);
      void import('./product-detail-modal');
      setShowProductDetail(true);
    } catch (error: any) {
      toast({
        title: '生成失败',
        description: error.message || '请稍后重试',
        variant: 'destructive',
      });
      generationStatus = 'error';
      failureReason = error?.message || error?.code || 'unknown-error';
    } finally {
      setIsGenerating(false);
      if (metricStart !== null) {
        const duration = Math.max(performance.now() - metricStart, 0);
        const attributes: Record<string, string | number> = {
          status: generationStatus,
          category,
        };
        if (failureReason) {
          attributes.error = failureReason.slice(0, 120);
        }
        logCustomPerformanceMetric('model_generation_ms', duration, attributes);
      }
    }
  };

  // 创作点击 - 打开品类选择器
  const handleCreationClick = (creation: Creation) => {
    setSelectedCreationForProduct(creation);
    void import('./category-selector');
    setShowCategorySelector(true);
  };

  // 商品点击 - 打开商品详情
  const handleModelClick = (creation: Creation, modelIndex: number) => {
    setSelectedCreationForProduct(creation);
    setSelectedModelIndex(modelIndex);
    void import('./product-detail-modal');
    setShowProductDetail(true);
  };

  // 购买商品
  const handlePurchase = (size: string) => {
    if (!selectedCreationForProduct) return;

    const model = selectedCreationForProduct.models?.[selectedModelIndex];
    if (!model) return;

    setCheckoutProduct({
      name: model.category,
      price: 29.99,
      size,
    });
    setShowProductDetail(false);
    void import('./checkout-flow');
    setShowCheckout(true);
  };

  const openSettings = useCallback(() => {
    void import('./settings-screen');
    setShowSettings(true);
  }, []);

  const openEditProfile = useCallback(() => {
    void import('./edit-profile-screen');
    setShowEditProfile(true);
  }, []);

  const openSearch = useCallback(() => {
    void import('./search-screen');
    setShowSearch(true);
  }, []);

  const openHistory = useCallback(() => {
    void import('./history-screen');
    setShowHistory(true);
  }, []);

  // 完成购买
  const handleCheckoutComplete = async (shippingInfo: any, paymentInfo: any) => {
    if (!userId || !selectedCreationForProduct) return;

    const model = selectedCreationForProduct.models?.[selectedModelIndex];
    if (!model) return;

    try {
      const order = await createOrderAction({
        userId,
        creationId: selectedCreationForProduct.id,
        modelUri: model.modelUri || model.uri,
        category: model.category,
        price: checkoutProduct?.price || 29.99,
        orderDetails: {
          color: '#000000',
          colorName: 'Default',
          size: checkoutProduct?.size || 'M',
          quantity: 1,
        },
        shippingInfo: {
          name: shippingInfo.fullName || shippingInfo.name || '',
          address: shippingInfo.address,
          phone: shippingInfo.phone,
          email: shippingInfo.email,
        },
        paymentSummary: {
          tokenId: 'mock_token',
          brand: 'Visa',
          last4: paymentInfo.cardNumber.slice(-4),
          gateway: 'mock' as const,
          status: 'succeeded' as const,
        },
      });

      setOrders(prev => [order, ...prev]);

      toast({
        title: '订单创建成功！',
        description: '可以在个人中心查看订单',
      });
    } catch (error: any) {
      throw new Error(error.message || '订单创建失败');
    }
  };

  // 保存用户资料
  const handleSaveProfile = async (data: { userName: string; bio: string; avatar?: string }) => {
    if (!userId) return;

    try {
      const result = await updateUserProfileAction({
        userId,
        name: data.userName,
        bio: data.bio,
        avatar: data.avatar,
      });

      if (result.success && result.profile) {
        setUserName(result.profile.name);
        setUserBio(result.profile.bio || '');
        setUserAvatar(result.profile.avatar);
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      throw error;
    }
  };

  // 刷新创作列表
  const handleRefreshCreations = async () => {
    try {
      const refreshedCreations = userId
        ? await getCreationsAction(userId)
        : await getPublicCreationsAction();

      // Preserve interaction flags while refreshing the backing data.
      const previousState = new Map(creations.map((creation) => [creation.id, creation]));
      const interactiveCreations = refreshedCreations.map((creation) => {
        const existing = previousState.get(creation.id);
        return {
          ...creation,
          isLiked: existing?.isLiked,
          isFavorited: existing?.isFavorited,
        };
      });

      setCreations(interactiveCreations);
      setHasMoreCreations(refreshedCreations.length >= 20);
    } catch (error) {
      console.error('Failed to refresh creations:', error);
    }
  };

  // 加载更多创作
  const handleLoadMoreCreations = async () => {
    if (isLoadingMore || !hasMoreCreations) return;

    setIsLoadingMore(true);
    try {
      // 模拟加载更多（实际应该传递分页参数）
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 这里应该调用带分页参数的API
      // const result = await getCreationsAction({ page: currentPage + 1 });
      setHasMoreCreations(false); // 暂时设为false，实际应根据API返回判断
    } catch (error) {
      console.error('Failed to load more creations:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        {activeTab === 'home' && !showCreateScreen && (
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
              currentUserId={userId}
              onIndexChange={setCurrentIndex}
              onLike={handleLike}
              onComment={handleComment}
              onFavorite={handleFavorite}
              onShare={handleShare}
              onUserClick={handleUserClick}
              onCreationClick={handleCreationClick}
              onModelClick={handleModelClick}
              onLoginRequired={() => setShowLoginModal(true)}
            />
          </motion.div>
        )}




        {activeTab === 'discover' && (
          <motion.div
            key="discover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <DiscoverScreen
              creations={creations}
              onCreationClick={(creation) => {
                const index = creations.findIndex(c => c.id === creation.id);
                if (index !== -1) {
                  setCurrentIndex(index);
                  setActiveTab('home');
                }
              }}
              onSearch={(query) => {
                toast({
                  title: '搜索',
                  description: `搜索: ${query}`,
                });
              }}
              onSearchClick={openSearch}
              onRefresh={handleRefreshCreations}
              onLoadMore={handleLoadMoreCreations}
              hasMore={hasMoreCreations}
              isLoading={isLoadingMore}
            />
          </motion.div>
        )}

        {activeTab === 'inbox' && (
          <motion.div
            key="inbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <InboxScreen
              userId={userId}
              orders={orders}
              onOrderClick={handleOrderClick}
            />
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
              currentUserId={userId}
              userName={userName}
              bio={userBio}
              creations={creations.filter((c) => c.userId === userId)}
              likedCreations={creations.filter((c) => Boolean(c.isLiked))}
              favoriteCreations={creations.filter((c) => Boolean(c.isFavorited))}
              orders={orders}
              stats={{
                creationCount: creations.filter((c) => c.userId === userId).length,
                likeCount: creations.reduce((sum, c) => sum + c.likeCount, 0),
                favoriteCount: creations.reduce((sum, c) => sum + c.favoriteCount, 0),
                followingCount: 0,  // TODO: Load from follow service
                followersCount: 0,  // TODO: Load from follow service
              }}
              isOwnProfile={true}
              isFollowing={false}
              isAuthenticated={isAuthenticated}
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
              onOrderClick={handleOrderClick}
              onEditProfile={openEditProfile}
              onLogin={handleOpenLogin}
              onLogout={async () => {
                try {
                  await onLogout();
                  setActiveTab('home');
                  toast({ title: '已退出登录' });
                } catch (error) {
                  toast({ title: '退出失败', variant: 'destructive' });
                }
              }}
              onSettings={openSettings}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 创作页面 */}
      <AnimatePresence>
        {showCreateScreen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0 z-50"
          >
            <CreateScreen
              onBack={() => setShowCreateScreen(false)}
              onGenerate={handleGeneratePattern}
              isGenerating={isGenerating}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部导航栏 */}
      {!showCreateScreen && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCreateClick={handleCreateClick}
        />
      )}

      {/* 评论抽屉 */}
      <CommentDrawer
        isOpen={isCommentDrawerOpen}
        onClose={() => setIsCommentDrawerOpen(false)}
        creationId={selectedCreationId || ''}
        userId={userId}
        isAuthenticated={isAuthenticated}
        onLogin={handleOpenLogin}
      />

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={onLogin}
        onRegister={onRegister}
      />

      {/* 品类选择器 */}
      <CategorySelector
        isOpen={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
        onSelect={handleGenerateModel}
        isGenerating={isGenerating}
      />

      {/* 商品详情弹窗 */}
      <ProductDetailModal
        isOpen={showProductDetail}
        onClose={() => setShowProductDetail(false)}
        creation={selectedCreationForProduct}
        modelIndex={selectedModelIndex}
        onPurchase={handlePurchase}
        onLike={() => selectedCreationForProduct && handleLike(selectedCreationForProduct.id)}
        onShare={() => selectedCreationForProduct && handleShare(selectedCreationForProduct.id)}
        isLiked={selectedCreationForProduct?.isLiked || false}
      />

      {/* 购买流程 */}
      <CheckoutFlow
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onComplete={handleCheckoutComplete}
        productName={checkoutProduct?.name || ''}
        productPrice={checkoutProduct?.price || 0}
        size={checkoutProduct?.size}
      />

      {/* 订单详情弹窗 */}
      <OrderDetailModal
        isOpen={showOrderDetail}
        onClose={() => setShowOrderDetail(false)}
        order={selectedOrder}
      />

      {/* 设置页面 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0 z-50"
          >
            <SettingsScreen
              onBack={() => setShowSettings(false)}
              onLogout={async () => {
                try {
                  await onLogout();
                  setShowSettings(false);
                  setActiveTab('home');
                  toast({ title: '已退出登录' });
                } catch (error) {
                  toast({ title: '退出失败', variant: 'destructive' });
                }
              }}
              onViewHistory={() => {
                setShowSettings(false);
                openHistory();
              }}
              isAuthenticated={isAuthenticated}
            />
          </motion.div>
        )}

        {/* 编辑资料页面 */}
        {showEditProfile && userId && (
          <motion.div
            key="edit-profile"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0 z-50"
          >
            <EditProfileScreen
              userId={userId}
              userName={userName}
              bio={userBio}
              avatar={userAvatar}
              onBack={() => setShowEditProfile(false)}
              onSave={handleSaveProfile}
            />
          </motion.div>
        )}

        {/* 搜索页面 */}
        {showSearch && (
          <motion.div
            key="search"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0 z-50"
          >
            <SearchScreen
              creations={creations}
              onCreationClick={(creation) => {
                const index = creations.findIndex(c => c.id === creation.id);
                if (index !== -1) {
                  setCurrentIndex(index);
                  setActiveTab('home');
                  setShowSearch(false);
                }
              }}
              onUserClick={(userId) => {
                // TODO: Navigate to user profile
                setShowSearch(false);
                toast({
                  title: '用户主页',
                  description: `查看用户: ${userId.slice(0, 8)}`,
                });
              }}
              onClose={() => setShowSearch(false)}
            />
          </motion.div>
        )}

        {/* 浏览历史页面 */}
        {showHistory && (
          <motion.div
            key="history"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0 z-50"
          >
            <HistoryScreen
              userId={userId}
              creations={creations}
              onBack={() => setShowHistory(false)}
              onCreationClick={(creation) => {
                const index = creations.findIndex(c => c.id === creation.id);
                if (index !== -1) {
                  setCurrentIndex(index);
                  setActiveTab('home');
                  setShowHistory(false);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
