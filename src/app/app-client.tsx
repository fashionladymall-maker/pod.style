
"use client";

import React, { useState, useEffect, useCallback, useContext, useMemo, useTransition } from 'react';
import {
    generatePatternAction,
    generateModelAction,
    getCreationsAction,
    deleteCreationAction,
    createOrderAction,
    getOrdersAction,
    toggleCreationPublicStatusAction,
    forkCreationAction,
    deleteCreationModelAction,
    toggleCreationModelVisibilityAction,
    getPersonalizedFeedsAction,
    logCreationInteractionAction,
    toggleLikeAction,
    toggleFavoriteAction,
    incrementShareCountAction,
    incrementRemakeCountAction
} from '@/server/actions';

import { useToast } from "@/hooks/use-toast";
import type { OrderDetails, ShippingInfo, PaymentSummary, Creation, Order } from '@/lib/types';
import { AuthContext } from '@/context/auth-context';


import HomeScreen from '@/components/screens/home-screen';
import LoadingScreen from '@/components/screens/loading-screen';
import ShippingScreen from '@/components/screens/shipping-screen';
import ConfirmationScreen from '@/components/screens/confirmation-screen';
import ProfileScreen from '@/components/screens/profile-screen';
import LoginScreen from '@/components/screens/login-screen';
import ViewerScreen from '@/components/screens/viewer-screen';
import { Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ToastAction } from '@/components/ui/toast';


export type AppStep = 'home' | 'generating' | 'categorySelection' | 'shipping' | 'confirmation' | 'profile' | 'login';
export type HomeTab = 'popular' | 'trending' | 'mine';
export interface ViewerState {
  isOpen: boolean;
  creationId: string | null;
  modelIndex: number; // -1 for pattern, >=0 for model
  sourceTab: HomeTab;
}

const podCategories = [
    { name: "T恤 (T-shirts)" },
    { name: "连帽衫 (Hoodies)" },
    { name: "运动卫衣 (Sweatshirts)" },
    { name: "帽子 (Hats)" },
    { name: "袜子 (Socks)" },
    { name: "帆布包 (Tote Bags)" },
    { name: "背包 (Backpacks)" },
    { name: "马克杯 (Mugs)" },
    { name: "水壶/保温杯 (Water Bottles/Tumblers)" },
    { name: "抱枕 (Pillows/Cushions)" },
    { name: "毯子 (Blankets)" },
    { name: "墙面艺术 (Wall Art)" },
    { name: "毛巾 (Towels)" },
    { name: "花园旗 (Garden Flags)" },
    { name: "手机壳 (Phone Cases)" },
    { name: "笔记本电脑保护套 (Laptop Sleeves)" },
    { name: "贴纸 (Stickers)" },
    { name: "笔记本和日志本 (Notebooks & Journals)" },
    { name: "珠宝 (Jewelry)" },
    { name: "拼图 (Puzzles)" },
];

const artStyles = [
    "无 (None)",
    "赛博朋克 (Cyberpunk)",
    "蒸汽朋克 (Steampunk)",
    "日系动漫 (Anime)",
    "美式漫画 (American Comic)",
    "汉服古风 (Hanfu/Ancient Chinese)",
    "水墨画 (Ink Wash Painting)",
    "油画 (Oil Painting)",
    "水彩 (Watercolor)",
    "素描 (Sketch)",
    "波普艺术 (Pop Art)",
    "超现实主义 (Surrealism)",
    "立体主义 (Cubism)",
    "印象派 (Impressionism)",
    "表现主义 (Expressionism)",
    "极简主义 (Minimalism)",
    "孟菲斯 (Memphis)",
    "Low Poly",
    "像素艺术 (Pixel Art)",
    "卡通 (Cartoon)",
    "概念艺术 (Concept Art)",
    "幻想 (Fantasy)",
    "哥特 (Gothic)",
    "抽象 (Abstract)",
    "部落图腾 (Tribal)",
    "梵高 (Van Gogh)",
    "达芬奇 (da Vinci)",
    "毕加索 (Picasso)",
    "莫奈 (Monet)",
    "伦勃朗 (Rembrandt)",
    "安迪·沃霍尔 (Andy Warhol)",
    "萨尔瓦多·达利 (Salvador Dalí)",
    "草间弥生 (Yayoi Kusama)",
    "葛饰北斋 (Hokusai)",
    "宫崎骏 (Hayao Miyazaki)",
    "阿尔丰斯·穆夏 (Alphonse Mucha)",
    "古斯塔夫·克里姆特 (Gustav Klimt)",
    "弗里达·卡罗 (Frida Kahlo)",
    "爱德华·蒙克 (Edvard Munch)",
    "让-米歇尔·巴斯奇亚 (Jean-Michel Basquiat)",
    "基思·哈林 (Keith Haring)",
    "班克西 (Banksy)",
    "村上隆 (Takashi Murakami)",
    "金政基 (Kim Jung Gi)",
    "天野喜孝 (Yoshitaka Amano)",
];

type PaymentFormState = {
  cardNumber: string;
  expiry: string;
  cvv: string;
};

const detectCardBrand = (cardNumber: string) => {
  const normalized = cardNumber.replace(/\s+/g, '');
  if (normalized.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(normalized)) return 'mastercard';
  if (/^3[47]/.test(normalized)) return 'amex';
  if (normalized.startsWith('6')) return 'discover';
  return 'unknown';
};

const buildPaymentSummary = (form: PaymentFormState): PaymentSummary => {
  const normalized = form.cardNumber.replace(/\s+/g, '');
  const last4 = normalized.slice(-4).padStart(4, '0');
  return {
    tokenId: `mock_${Date.now()}`,
    brand: detectCardBrand(normalized),
    last4,
    gateway: 'mock',
    status: 'pending',
  };
};

const MOCK_PRICE = 129;

interface AppClientProps {
  initialPublicCreations: Creation[];
  initialTrendingCreations: Creation[];
}


const AppClient = ({ initialPublicCreations, initialTrendingCreations }: AppClientProps) => {
    const { user, authLoading, signOut } = useContext(AuthContext);

    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;

        const disableOverlay = () => {
            const overlay = (window as typeof window & { __NEXT_REACT_DEV_OVERLAY__?: { setIsEnabled?: (enabled: boolean) => void } }).__NEXT_REACT_DEV_OVERLAY__;
            overlay?.setIsEnabled?.(false);
        };

        const intervalId = window.setInterval(disableOverlay, 1000);
        return () => window.clearInterval(intervalId);
    }, []);
    const hasActiveUser = !!user;
    const isAuthenticated = !!(user && !user.isAnonymous);
    const [step, setStep] = useState<AppStep>('home');
    const [prompt, setPrompt] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [creations, setCreations]  = useState<Creation[]>([]);
    const [publicCreations, setPublicCreations] = useState<Creation[]>(initialPublicCreations);
    const [trendingCreations, setTrendingCreations] = useState<Creation[]>(initialTrendingCreations);
    const [popularVisibleCount, setPopularVisibleCount] = useState(12);
    const [trendingVisibleCount, setTrendingVisibleCount] = useState(12);
    const [isLoadingFeedsState, setIsLoadingFeedsState] = useState(false);
    const [isPendingFeeds, startFeedTransition] = useTransition();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [orderDetails, setOrderDetails] = useState<OrderDetails>({ color: 'bg-white', colorName: 'white', size: 'M', quantity: 1 });
    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({ name: '', address: '', phone: '' });
    const [paymentForm, setPaymentForm] = useState<PaymentFormState>({ cardNumber: '', expiry: '', cvv: '' });
    const [selectedStyle, setSelectedStyle] = useState(artStyles[0]);
    const [lastOrderedCategory, setLastOrderedCategory] = useState('T恤');
    const { toast } = useToast();

    const [viewerState, setViewerState] = useState<ViewerState>({
      isOpen: false,
      creationId: null,
      modelIndex: -1,
      sourceTab: 'popular',
    });
    const [pendingModelRequest, setPendingModelRequest] = useState<{ creationId: string; sourceTab: HomeTab } | null>(null);
    
    const getCreationsByTab = useCallback((tab: HomeTab) => {
        switch(tab) {
            case 'popular':
                return publicCreations;
            case 'trending':
                return trendingCreations;
            case 'mine':
            default:
                return creations;
        }
    }, [creations, publicCreations, trendingCreations]);

    const getSourceCreations = useCallback(() => {
        return getCreationsByTab(viewerState.sourceTab);
    }, [viewerState.sourceTab, getCreationsByTab]);


    const fetchCreations = useCallback(async (userId: string) => {
        try {
            const userCreations = await getCreationsAction(userId);
            setCreations(userCreations);
        } catch (error) {
            console.error("Failed to fetch creations:", error);
            toast({ variant: "destructive", title: "获取作品失败", description: "加载您的作品时发生错误。" });
        }
    }, [toast]);
    
    const fetchOrders = useCallback(async (userId: string) => {
      try {
        const userOrders = await getOrdersAction(userId);
        setOrders(userOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    }, []);

    const allCreations = useMemo(() => {
      const map = new Map<string, Creation>();
      [creations, publicCreations, trendingCreations].forEach(list => {
        list.forEach(item => {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          }
        });
      });
      return map;
    }, [creations, publicCreations, trendingCreations]);

    useEffect(() => {
      if (user) {
        Promise.all([
          fetchCreations(user.uid),
          fetchOrders(user.uid)
        ]).then(() => {
           // Only navigate away from login screen if user successfully upgraded from anonymous
           // Don't navigate if user is still anonymous or if not on login screen
           if (step === 'login' && !user.isAnonymous) {
             setStep('home');
           }
        });
      } else if (!authLoading) {
        // User is logged out, clear their data
        setCreations([]);
        setOrders([]);
        setPendingModelRequest(null);
      }
    }, [user, authLoading, fetchCreations, fetchOrders, step]);


    useEffect(() => {
        if (step === 'shipping' && orders.length > 0) {
            const lastOrder = orders[0];
            if (lastOrder.shippingInfo) {
                setShippingInfo(lastOrder.shippingInfo);
            }
        }
    }, [step, orders]);

    useEffect(() => {
      let cancelled = false;

      const loadPersonalizedFeeds = async () => {
        if (!user || user.isAnonymous) {
          setPublicCreations(initialPublicCreations);
          setTrendingCreations(initialTrendingCreations);
          setPopularVisibleCount(12);
          setTrendingVisibleCount(12);
          return;
        }
        try {
          setIsLoadingFeedsState(true);
          const feeds = await getPersonalizedFeedsAction(user.uid);
          if (!cancelled && feeds) {
            setPublicCreations(feeds.popular);
            setTrendingCreations(feeds.trending);
            setPopularVisibleCount(Math.min(12, feeds.popular.length));
            setTrendingVisibleCount(Math.min(12, feeds.trending.length));
          }
        } catch (error) {
          console.error('Failed to load personalized feeds:', error);
        } finally {
          if (!cancelled) {
            setIsLoadingFeedsState(false);
          }
        }
      };

      startFeedTransition(() => {
        loadPersonalizedFeeds();
      });

      return () => {
        cancelled = true;
      };
    }, [user, initialPublicCreations, initialTrendingCreations]);

    useEffect(() => {
      if (!authLoading && hasActiveUser && pendingModelRequest && step === 'login') {
        setStep('categorySelection');
      }
    }, [authLoading, hasActiveUser, pendingModelRequest, step]);

    const updateCreationsState = useCallback((updatedCreation: Creation) => {
      const updateList = (list: Creation[]) => list.map(c => c.id === updatedCreation.id ? updatedCreation : c);
      setCreations(updateList);
      setPublicCreations(updateList);
      setTrendingCreations(updateList);
    }, []);

    const handleGeneratePattern = useCallback(async () => {
        if (!user) {
            toast({ variant: 'destructive', title: '无法生成图案', description: '正在尝试建立会话，请稍后重试或登录账户。' });
            return;
        }
        if (!prompt && !uploadedImage) {
            toast({ variant: 'destructive', title: 'Prompt is empty', description: 'Please enter your creative ideas or upload an image!' });
            return;
        }
        setIsLoading(true);
        setLoadingText('正在生成创意图案...');
        setStep('generating');

        try {
            setLoadingText('AI 正在创作图案...');
            const styleValue = selectedStyle.split(' ')[0] || '无';
            const newCreation = await generatePatternAction({
                userId: user.uid,
                prompt,
                referenceImage: uploadedImage ?? undefined,
                style: styleValue,
            });

            setCreations(prev => [newCreation, ...prev]);
            setViewerState({ isOpen: true, creationId: newCreation.id, modelIndex: -1, sourceTab: 'mine' });
            setStep('home');
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : '图案生成过程中发生网络错误。';
            toast({
              variant: 'destructive',
              title: '图案生成失败',
              description: message,
              action: (
                <ToastAction altText="重试" onClick={() => handleGeneratePattern()}>
                  重试
                </ToastAction>
              ),
            });
            setStep('home');
        } finally {
            setIsLoading(false);
            setLoadingText('');
        }
    }, [prompt, uploadedImage, selectedStyle, user, toast]);

    const handleGenerateModel = useCallback(async (category: string) => {
        const reference = pendingModelRequest ?? (viewerState.creationId ? {
            creationId: viewerState.creationId,
            sourceTab: viewerState.sourceTab,
        } : null);

        if (!reference) {
            toast({ variant: 'destructive', title: '操作无效', description: '请先选择一个创意图案。' });
            setStep('home');
            return;
        }

        if (!user) {
            toast({ variant: 'destructive', title: '暂时无法生成', description: '正在尝试建立会话，请稍后重试或登录账户。' });
            setPendingModelRequest(reference);
            return;
        }

        const sourceCreations = getCreationsByTab(reference.sourceTab);
        const activeCreation = sourceCreations.find(c => c.id === reference.creationId);

        if (!activeCreation) {
            toast({ variant: 'destructive', title: '找不到创意', description: '请重新选择一个创意图案后再试。' });
            setPendingModelRequest(null);
            setStep('home');
            return;
        }

        setIsLoading(true);
        setLoadingText('正在准备生成商品效果图...');
        setViewerState(prev => ({ ...prev, isOpen: false }));
        setStep('generating');

        try {
            let targetCreation = activeCreation;
            let targetSourceTab = reference.sourceTab;
            let currentReference = reference;

            if (activeCreation.userId !== user.uid) {
                const clonedCreation = await forkCreationAction({
                  sourceCreationId: activeCreation.id,
                  userId: user.uid,
                });

                setCreations(prev => [clonedCreation, ...prev]);
                targetCreation = clonedCreation;
                targetSourceTab = 'mine';
                currentReference = { creationId: clonedCreation.id, sourceTab: 'mine' };

                setViewerState({
                  isOpen: false,
                  creationId: clonedCreation.id,
                  modelIndex: -1,
                  sourceTab: 'mine',
                });
            }

            setPendingModelRequest(currentReference);
            setLoadingText('AI 正在生成商品效果图...');
            const updatedCreation = await generateModelAction({
                creationId: targetCreation.id,
                userId: user.uid,
                patternDataUri: targetCreation.patternUri,
                colorName: orderDetails.colorName,
                category,
            });

            updateCreationsState(updatedCreation);
            setViewerState({
              isOpen: true,
              creationId: updatedCreation.id,
              modelIndex: updatedCreation.models.length - 1,
              sourceTab: targetSourceTab,
            });
            setPendingModelRequest(null);
            setStep('home');
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : '效果图生成过程中发生网络错误。';
            toast({
              variant: 'destructive',
              title: '效果图生成失败',
              description: message,
              action: (
                <ToastAction altText="重试" onClick={() => handleGenerateModel(category)}>
                  重试
                </ToastAction>
              ),
            });
            setViewerState(prev => ({ ...prev, isOpen: true, modelIndex: -1 }));
            setStep('home');
        } finally {
            setIsLoading(false);
            setLoadingText('');
        }
    }, [pendingModelRequest, viewerState.creationId, viewerState.sourceTab, orderDetails.colorName, user, toast, getCreationsByTab, updateCreationsState]);

    const handleDeleteCreation = useCallback(async (creationId: string) => {
        const originalCreations = creations;
        const newCreations = creations.filter(c => c.id !== creationId);
        setCreations(newCreations); 

        try {
            await deleteCreationAction(creationId);
            toast({ title: "删除成功", description: "您的作品已被删除。" });
            
            if(viewerState.creationId === creationId) {
                setViewerState({ isOpen: false, creationId: null, modelIndex: -1, sourceTab: 'mine' });
            }

            if (newCreations.length === 0 && step === 'profile') {
                 setStep('home');
            }
        } catch (error) {
            console.error("Failed to delete creation:", error);
            toast({ variant: "destructive", title: "删除失败", description: "无法删除您的作品，请重试。" });
            setCreations(originalCreations); 
        }
    }, [creations, toast, viewerState.creationId, step]);
    
    const goToHistory = (creation: Creation, modelIndex: number = -1) => {
        setViewerState({ isOpen: true, creationId: creation.id, modelIndex, sourceTab: 'mine' });
    };

    useEffect(() => {
      setPopularVisibleCount(prev => Math.min(Math.max(prev, 12), publicCreations.length || 12));
    }, [publicCreations]);

    useEffect(() => {
      setTrendingVisibleCount(prev => Math.min(Math.max(prev, 12), trendingCreations.length || 12));
    }, [trendingCreations]);

    const handleLoadMorePopular = useCallback(() => {
      setPopularVisibleCount(prev => Math.min(prev + 9, publicCreations.length));
    }, [publicCreations.length]);

    const handleLoadMoreTrending = useCallback(() => {
      setTrendingVisibleCount(prev => Math.min(prev + 9, trendingCreations.length));
    }, [trendingCreations.length]);
    
    const handleSelectPublicCreation = (creation: Creation, source: HomeTab, modelIndex?: number) => {
        const existingIndex = creations.findIndex(c => c.id === creation.id);

        if (existingIndex === -1) {
            setCreations(prev => [creation, ...prev]);
        }

        setViewerState({
            isOpen: true,
            creationId: creation.id,
            modelIndex: modelIndex ?? -1,
            sourceTab: source
        });
    };
    
    const handleTogglePublic = async (creationId: string, currentStatus: boolean) => {
      const optimisticUpdate = (list: Creation[]) => list.map(c => 
        c.id === creationId ? { ...c, isPublic: !currentStatus } : c
      );
      setCreations(optimisticUpdate);
      setPublicCreations(optimisticUpdate);
      setTrendingCreations(optimisticUpdate);

      try {
        await toggleCreationPublicStatusAction(creationId, !currentStatus);
        toast({
          title: "更新成功",
          description: `您的作品已${!currentStatus ? '公开' : '设为私密'}。`,
        });
      } catch (error) {
        console.error('Failed to toggle public status:', error);
        toast({
          variant: "destructive",
          title: "更新失败",
          description: "无法更新作品状态，请重试。",
        });
        const pesimisticUpdate = (list: Creation[]) => list.map(c => 
          c.id === creationId ? { ...c, isPublic: currentStatus } : c
        );
        setCreations(pesimisticUpdate);
        setPublicCreations(pesimisticUpdate);
        setTrendingCreations(pesimisticUpdate);
      }
    };


    const handleSignOut = async () => {
        try {
            await signOut();
            toast({ title: "已退出登录" });
            setStep('home');
        } catch (error) {
            console.error("Error signing out:", error);
            toast({ variant: "destructive", title: "退出登录失败", description: "退出时发生错误，请稍后重试。" });
        }
    };

    const handleLikeToggle = useCallback(async (creationId: string, userId: string, isLiked: boolean) => {
        const result = await toggleLikeAction(creationId, userId, isLiked);
        logCreationInteractionAction({
          userId,
          creationId,
          action: 'like',
          weight: isLiked ? -2 : 2,
          metadata: { toggledOff: isLiked },
        });
        return result;
    }, []);

    const handleFavoriteToggle = useCallback(async (creationId: string, userId: string, isFavorited: boolean) => {
        const result = await toggleFavoriteAction(creationId, userId, isFavorited);
        logCreationInteractionAction({
          userId,
          creationId,
          action: 'favorite',
          weight: isFavorited ? -3 : 3,
          metadata: { toggledOff: isFavorited },
        });
        return result;
    }, []);

    const handleShare = useCallback(async (creationId: string) => {
        const result = await incrementShareCountAction(creationId);
        if (user) {
          logCreationInteractionAction({
            userId: user.uid,
            creationId,
            action: 'share',
            weight: 1,
          });
        }
        return result;
    }, [user]);

    const handleRemake = useCallback(async (creationId: string) => {
        const result = await incrementRemakeCountAction(creationId);
        if (user) {
          logCreationInteractionAction({
            userId: user.uid,
            creationId,
            action: 'remake',
            weight: 4,
          });
        }
        return result;
    }, [user]);

    const handlePlaceOrder = async () => {
        if (user?.isAnonymous && !shippingInfo.email) {
          toast({
            variant: "destructive",
            title: "需要邮箱",
            description: "匿名用户下单需要提供邮箱以追踪订单。",
          });
          setStep('shipping');
          return;
        }

        setIsLoading(true);
        setLoadingText("正在处理您的订单...");
        setStep('generating');
        
        const activeCreation = viewerState.creationId ? allCreations.get(viewerState.creationId) : undefined;
        const activeModel = viewerState.modelIndex !== undefined && viewerState.modelIndex >= 0
          ? activeCreation?.models?.[viewerState.modelIndex]
          : undefined;

        if (!user || !activeCreation || !activeModel) {
            toast({ variant: 'destructive', title: '订单错误', description: '无法找到订单信息，请重试。' });
            setIsLoading(false);
            setStep('home');
            setViewerState(prev => ({...prev, isOpen: true}));
            return;
        }

        try {
            const paymentSummary = buildPaymentSummary(paymentForm);
            const newOrder = await createOrderAction({
                userId: user.uid,
                creationId: activeCreation.id,
                modelUri: activeModel.uri,
                category: activeModel.category,
                orderDetails,
                shippingInfo,
                paymentSummary,
                price: MOCK_PRICE,
            });

            setOrders(prev => [newOrder, ...prev]);
            setLastOrderedCategory(activeModel.category);
            setStep('confirmation');

        } catch (error) {
            console.error("Failed to create order:", error);
            toast({
              variant: 'destructive',
              title: '下单失败',
              description: '创建订单时发生错误，请稍后重试。',
              action: (
                <ToastAction altText="重试" onClick={() => handlePlaceOrder()}>
                  重试
                </ToastAction>
              ),
            });
            setStep('shipping');
        } finally {
            setIsLoading(false);
            setLoadingText('');
        }
    };
    
    const handleQuantityChange = (amount: number) => { setOrderDetails(prev => ({ ...prev, quantity: Math.max(1, prev.quantity + amount) })); };

    const handleDeleteModel = useCallback(async (creationId: string, modelUri: string) => {
        try {
            const updatedCreation = await deleteCreationModelAction({ creationId, modelUri });
            updateCreationsState(updatedCreation);

            if (viewerState.creationId === creationId) {
                const remainingModels = updatedCreation.models || [];
                const newModelIndex = Math.min(viewerState.modelIndex, remainingModels.length - 1);
                setViewerState(prev => ({
                    ...prev,
                    modelIndex: newModelIndex >= 0 ? newModelIndex : -1,
                    creationId: updatedCreation.id,
                }));
            }

            toast({ title: '删除成功', description: '已移除所选商品效果图。' });
        } catch (error) {
            console.error('Failed to delete model:', error);
            toast({ variant: 'destructive', title: '删除失败', description: '无法删除该商品效果图，请稍后再试。' });
        }
    }, [updateCreationsState, viewerState.creationId, viewerState.modelIndex, toast]);

    const handleToggleModelVisibility = useCallback(async (creationId: string, modelUri: string, targetVisibility: boolean) => {
        try {
            const updatedCreation = await toggleCreationModelVisibilityAction({ creationId, modelUri, isPublic: targetVisibility });
            updateCreationsState(updatedCreation);

            if (viewerState.creationId === creationId) {
                const models = updatedCreation.models || [];
                const targetIndex = models.findIndex(model => model.uri === modelUri);
                if (targetIndex !== -1 && targetVisibility === false && viewerState.modelIndex === targetIndex) {
                    setViewerState(prev => ({ ...prev, modelIndex: -1 }));
                }
            }

            toast({ title: targetVisibility ? '已公开' : '已设为私密' });
        } catch (error) {
            console.error('Failed to update model visibility:', error);
            toast({ variant: 'destructive', title: '操作失败', description: '无法更新商品公开状态，请稍后再试。' });
        }
    }, [updateCreationsState, viewerState.creationId, viewerState.modelIndex, toast]);
    
    const resetOrderFlow = () => {
        setOrderDetails({ color: 'bg-white', colorName: 'white', size: 'M', quantity: 1 });
        setShippingInfo({ name: '', address: '', phone: '' });
        setPaymentForm({ cardNumber: '', expiry: '', cvv: '' });
        setStep('home');
    };

    const handleGoHome = () => {
        setStep('home');
    }
    
    const AppHeader = () => {
        if (step === 'home') {
            return null;
        }
        const title = 'POD.STYLE';
        let showBack = false;
        const canShowProfile = !!user;

        switch(step) {
            case 'profile':
            case 'shipping':
            case 'categorySelection':
                showBack = true;
                break;
        }

        const handleBack = () => {
            if (step === 'profile') {
                setStep('home');
            } else if (step === 'categorySelection' || step === 'shipping') {
                setViewerState(prev => ({ ...prev, isOpen: true }));
                setStep('home');
            } else {
                setStep('home');
            }
        }

        return (
          <header className="flex items-center justify-between px-2 py-1 bg-background border-b flex-shrink-0">
              {showBack ? (
                  <Button variant="ghost" size="sm" className="w-9" onClick={handleBack}><ArrowLeft /></Button>
              ) : (
                  <Button variant="ghost" size="sm" className="w-9"><Menu /></Button>
              )}
              
              <Button variant="ghost" onClick={() => setStep('home')} className="p-0 h-auto">
                  <h1 className="text-base font-medium">{title}</h1>
              </Button>

              {step === 'login' ? (
                <div className="w-9" />
              ) : canShowProfile ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-9 h-9"
                  onClick={() => setStep('profile')}
                >
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user?.isAnonymous ? '访' : (user?.displayName?.[0] || user?.email?.[0])?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-3 rounded-full"
                  onClick={() => setStep('login')}
                >
                  登录
                </Button>
              )}
          </header>
        );
    };

    const CategorySelectionScreen = () => {
        const colors = [
          'bg-rose-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-sky-500', 'bg-emerald-500', 'bg-fuchsia-500', 'bg-amber-500', 'bg-cyan-500'
        ];
        
        const parseCategory = (name: string) => {
            const match = name.match(/^(.*?)\s*\((.*?)\)$/);
            if (match) {
                return { chinese: match[1], english: match[2] };
            }
            return { chinese: name, english: '' };
        }

        return (
            <div className="flex flex-col h-full animate-fade-in">
                <ScrollArea className="flex-grow">
                    <div className="grid grid-cols-2 gap-4 p-4">
                        {podCategories.map((category, index) => {
                            const { chinese, english } = parseCategory(category.name);
                            return (
                                <Button
                                    key={category.name}
                                    variant="secondary"
                                    className={cn(
                                        "h-24 text-white flex flex-col justify-center items-center text-center p-2 leading-tight rounded-lg shadow-md transition-colors duration-200",
                                        colors[index % colors.length],
                                        "hover:bg-black hover:text-white"
                                    )}
                                    onClick={() => handleGenerateModel(category.name)}
                                >
                                    <span className="font-semibold text-base">{chinese}</span>
                                    {english && <span className="text-xs opacity-90 mt-1">{english}</span>}
                                </Button>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>
        );
    };

    const renderStep = () => {
        switch (step) {
            case 'login': return <LoginScreen />;
            case 'generating': return <LoadingScreen text={loadingText} />;
            case 'categorySelection': return <CategorySelectionScreen />;
            case 'shipping': return <ShippingScreen 
                user={user}
                shippingInfo={shippingInfo} 
                setShippingInfo={setShippingInfo} 
                onNext={handlePlaceOrder} 
                onBack={() => {
                  setStep('home');
                  setViewerState(prev => ({...prev, isOpen: true}));
                }}
                isLoading={isLoading}
            />;
            case 'confirmation': return <ConfirmationScreen onGoHome={handleGoHome} onReset={resetOrderFlow} category={lastOrderedCategory} />;
            case 'profile': return <ProfileScreen
                user={user}
                creations={creations}
                orders={orders}
                onGoToHistory={goToHistory}
                onSignOut={handleSignOut}
                onDeleteCreation={handleDeleteCreation}
                onDeleteModel={handleDeleteModel}
                onToggleModelVisibility={handleToggleModelVisibility}
                onLoginRequest={() => setStep('login')}
                onTogglePublic={handleTogglePublic}
            />;
            case 'home':
            default:
                return <HomeScreen
                    prompt={prompt} setPrompt={setPrompt}
                    uploadedImage={uploadedImage} setUploadedImage={setUploadedImage}
                    onGenerate={handleGeneratePattern}
                    publicCreations={publicCreations}
                    trendingCreations={trendingCreations}
                    popularVisibleCount={popularVisibleCount}
                    trendingVisibleCount={trendingVisibleCount}
                    onLoadMorePopular={handleLoadMorePopular}
                    onLoadMoreTrending={handleLoadMoreTrending}
                    onSelectPublicCreation={handleSelectPublicCreation}
                    isFeedLoading={isLoadingFeedsState || isPendingFeeds}
                    isLoading={isLoading}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    artStyles={artStyles}
                    selectedStyle={selectedStyle}
                    setSelectedStyle={setSelectedStyle}
                    onLoginRequest={() => setStep('login')}
                    onViewProfile={() => setStep('profile')}
                    hasUserSession={hasActiveUser}
                    isAuthenticated={isAuthenticated}
                />;
        }
    };
    

    const renderMainContent = () => (
        <div className="w-full bg-card overflow-hidden" style={{ height: '100%' }}>
            <div className="h-full flex flex-col">
                <AppHeader/>
                <div className="flex-grow min-h-0">
                    {renderStep()}
                </div>
            </div>
        </div>
    );

    return (
        <main className="h-full w-full bg-background text-foreground font-sans">
            { authLoading ? (
                <div className="w-full h-full flex flex-col">
                    <div className="flex-grow min-h-0">
                        <LoadingScreen>
                            <div className="text-center">
                                <h1 className="text-2xl font-medium text-foreground">POD.STYLE</h1>
                                <p className="text-muted-foreground mt-4">
                                    放飞思想，随心定制
                                    <br />
                                    <span className="text-sm">Free Your Mind, Customize Your Way.</span>
                                </p>
                            </div>
                        </LoadingScreen>
                    </div>
                </div>
            ) : (
                renderMainContent()
            )}

            {viewerState.isOpen && (
              <ViewerScreen
                user={user}
                viewerState={viewerState}
                setViewerState={setViewerState}
                sourceCreations={getSourceCreations()}
                orderDetails={orderDetails}
                setOrderDetails={setOrderDetails}
                handleQuantityChange={handleQuantityChange}
                hasActiveUser={hasActiveUser}
                onLoginRequest={() => setStep('login')}
                onNext={() => {
                  setViewerState(prev => ({...prev, isOpen: false}));
                  setStep('shipping');
                }}
                onGoToCategorySelection={(creation) => {
                   if (!creation) {
                     return;
                   }
                   const request = { creationId: creation.id, sourceTab: viewerState.sourceTab };
                   setPendingModelRequest(request);
                   setViewerState(prev => ({...prev, isOpen: false}));
                   if (!user) {
                     toast({
                       variant: 'destructive',
                       title: '暂时无法生成',
                       description: '正在尝试建立会话，请稍后重试或登录账户。',
                     });
                     return;
                   }
                   setStep('categorySelection');
                }}
                price={MOCK_PRICE}
                onLikeToggle={handleLikeToggle}
                onFavoriteToggle={handleFavoriteToggle}
                onShare={handleShare}
                onUpdateCreation={updateCreationsState}
                onRemake={handleRemake}
              />
            )}
        </main>
    );
};

export default AppClient;

    
