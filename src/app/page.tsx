
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { generatePatternAction, generateModelAction, getCreationsAction, deleteCreationAction, createOrderAction, getOrdersAction, getPublicCreationsAction, getTrendingCreationsAction, toggleCreationPublicStatusAction } from '@/app/actions';

import { useToast } from "@/hooks/use-toast";
import type { OrderDetails, ShippingInfo, PaymentInfo, FirebaseUser, Creation, Order, AuthCredential } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, signInAnonymously, linkWithCredential, GoogleAuthProvider } from "firebase/auth";


import HomeScreen from '@/components/screens/home-screen';
import LoadingScreen from '@/components/screens/loading-screen';
import ShippingScreen from '@/components/screens/shipping-screen';
import PaymentScreen from '@/components/screens/payment-screen';
import ConfirmationScreen from '@/components/screens/confirmation-screen';
import ProfileScreen from '@/components/screens/profile-screen';
import LoginScreen from '@/components/screens/login-screen';
import ViewerScreen from '@/components/screens/viewer-screen';
import { Menu, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Script from 'next/script';


export type AppStep = 'home' | 'generating' | 'categorySelection' | 'shipping' | 'payment' | 'confirmation' | 'profile' | 'login';
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

const MOCK_PRICE = 129;

const App = () => {
    const [step, setStep] = useState<AppStep>('home');
    const [prompt, setPrompt] = useState('');
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [creations, setCreations]  = useState<Creation[]>([]);
    const [publicCreations, setPublicCreations] = useState<Creation[]>([]);
    const [trendingCreations, setTrendingCreations] = useState<Creation[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true); // For user data fetching, start as true
    const [isRecording, setIsRecording] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [orderDetails, setOrderDetails] = useState<OrderDetails>({ color: 'bg-white', colorName: 'white', size: 'M', quantity: 1 });
    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({ name: '', address: '', phone: '' });
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({ cardNumber: '', expiry: '', cvv: '' });
    const [selectedStyle, setSelectedStyle] = useState(artStyles[0]);
    const [lastOrderedCategory, setLastOrderedCategory] = useState('T恤');
    const { toast } = useToast();

    const [viewerState, setViewerState] = useState<ViewerState>({
      isOpen: false,
      creationId: null,
      modelIndex: -1,
      sourceTab: 'popular',
    });

    const fetchCreations = useCallback(async (userId: string) => {
        setIsDataLoading(true);
        try {
            const userCreations = await getCreationsAction(userId);
            setCreations(userCreations);
        } catch (error) {
            console.error("Failed to fetch creations:", error);
            toast({ variant: "destructive", title: "获取作品失败", description: "加载您的作品时发生错误。" });
        } finally {
            setIsDataLoading(false);
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
    
    const fetchCommunityCreations = useCallback(async () => {
      setIsDataLoading(true);
      try {
        const [publicRes, trendingRes] = await Promise.all([
          getPublicCreationsAction(),
          getTrendingCreationsAction()
        ]);
        setPublicCreations(publicRes);
        setTrendingCreations(trendingRes);
      } catch (error) {
        console.error("Failed to fetch community creations:", error);
        toast({ variant: "destructive", title: "获取社区作品失败", description: String(error) });
      } finally {
        setIsDataLoading(false);
      }
    }, [toast]);


    useEffect(() => {
        let isSigningOut = false; // Flag to prevent race condition
        fetchCommunityCreations();

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (isSigningOut) {
                return;
            }

            if (firebaseUser) {
                const wasAnonymous = user?.isAnonymous;
                const isPermanent = !firebaseUser.isAnonymous;

                if ((wasAnonymous && isPermanent) || user?.uid !== firebaseUser.uid) {
                    fetchCreations(firebaseUser.uid);
                    fetchOrders(firebaseUser.uid);
                }

                setUser(firebaseUser);
                setAuthLoading(false);
                
                if (isPermanent && step === 'login') {
                    setStep('home');
                }

            } else {
                setCreations([]);
                setOrders([]);
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed:", error);
                    toast({ variant: 'destructive', title: '网络错误', description: '无法连接到服务，请刷新页面重试。'});
                    setAuthLoading(false);
                });
            }
        });

        const customSignOut = async () => {
            isSigningOut = true;
            await firebaseSignOut(auth);
            isSigningOut = false;
        };

        (auth as any).customSignOut = customSignOut;

        return () => unsubscribe();
    }, [fetchCreations, fetchOrders, fetchCommunityCreations, toast, user?.isAnonymous, user?.uid, step]);

    useEffect(() => {
        if ((step === 'shipping' || step === 'payment') && orders.length > 0) {
            const lastOrder = orders[0];
            if (lastOrder.shippingInfo) {
                setShippingInfo(lastOrder.shippingInfo);
            }
            if (lastOrder.paymentInfo) {
                setPaymentInfo(lastOrder.paymentInfo);
            }
        }
    }, [step, orders]);


    const handleGeneratePattern = useCallback(async () => {
        if (!user) {
            toast({ variant: 'destructive', title: '请先登录', description: '您需要登录后才能生成创意图案。' });
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
            const styleValue = selectedStyle.split(' ')[0];
            const newCreation = await generatePatternAction({
                userId: user.uid,
                prompt,
                inspirationImage: uploadedImage ?? undefined,
                style: styleValue !== '无' ? styleValue : undefined,
            });

            const updatedCreations = [newCreation, ...creations];
            setCreations(updatedCreations);
            setViewerState({ isOpen: true, creationId: newCreation.id, modelIndex: -1, sourceTab: 'mine' });
            setStep('home');
        } catch (err: any) {
            console.error(err);
            toast({ variant: 'destructive', title: '图案生成失败', description: err.message || '图案生成过程中发生网络错误。' });
            setStep('home');
        } finally {
            setIsLoading(false);
        }
    }, [prompt, uploadedImage, selectedStyle, user, toast, creations]);

    const handleGenerateModel = useCallback(async (category: string) => {
        const activeCreation = creations.find(c => c.id === viewerState.creationId);
        if (!user || !activeCreation) {
            toast({ variant: 'destructive', title: '操作无效', description: '没有可用的图案来生成模特图。' });
            setViewerState(prev => ({ ...prev, isOpen: false }));
            return;
        }
        setIsLoading(true);
        setLoadingText('正在为您生成商品效果图...');
        setViewerState(prev => ({ ...prev, isOpen: false })); // Close viewer while generating
        setStep('generating');

        try {
            const updatedCreation = await generateModelAction({
                creationId: activeCreation.id,
                userId: user.uid,
                patternDataUri: activeCreation.patternUri,
                colorName: orderDetails.colorName,
                category: category,
            });
            
            const newCreations = creations.map((c) => 
                c.id === updatedCreation.id ? updatedCreation : c
            );

            setCreations(newCreations);
            setViewerState({ 
              isOpen: true, 
              creationId: updatedCreation.id,
              modelIndex: updatedCreation.models.length - 1,
              sourceTab: viewerState.sourceTab
            });
            setStep('home');
        } catch (err: any) {
            console.error(err);
            toast({ variant: 'destructive', title: '效果图生成失败', description: err.message || '效果图生成过程中发生网络错误。' });
            // Re-open viewer to the pattern
            setViewerState(prev => ({ ...prev, isOpen: true, modelIndex: -1 }));
            setStep('home');
        } finally {
            setIsLoading(false);
        }
    }, [viewerState.creationId, viewerState.sourceTab, creations, orderDetails.colorName, user, toast]);

    const handleDeleteCreation = useCallback(async (creationId: string) => {
        const originalCreations = creations;
        const newCreations = creations.filter(c => c.id !== creationId);
        setCreations(newCreations); 

        try {
            await deleteCreationAction(creationId);
            toast({ title: "删除成功", description: "您的作品已被删除。" });
            
            // If the deleted creation was being viewed, close the viewer.
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
        toast({
          variant: "destructive",
          title: "更新失败",
          description: "无法更新作品状态，请重试。",
        });
        // Revert UI on failure
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
            await ((auth as any).customSignOut || firebaseSignOut)(auth);
            toast({ title: "已退出登录" });
            setStep('home');
        } catch (error) {
            console.error("Error signing out:", error);
            toast({ variant: "destructive", title: "退出登录失败", description: "退出时发生错误，请稍后重试。" });
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        
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
        
        const activeCreation = creations.find(c => c.id === viewerState.creationId);
        const activeModel = activeCreation?.models[viewerState.modelIndex];

        if (!user || !activeCreation || !activeModel) {
            toast({ variant: 'destructive', title: '订单错误', description: '无法找到订单信息，请重试。' });
            setIsLoading(false);
            setStep('home');
            setViewerState(prev => ({...prev, isOpen: true}));
            return;
        }

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const newOrder = await createOrderAction({
                userId: user.uid,
                creationId: activeCreation.id,
                model: activeModel,
                orderDetails,
                shippingInfo,
                paymentInfo,
                price: MOCK_PRICE,
            });

            setOrders(prev => [newOrder, ...prev]);
            setLastOrderedCategory(activeModel.category);
            setStep('confirmation');

        } catch (error) {
            console.error("Failed to create order:", error);
            toast({ variant: 'destructive', title: '下单失败', description: '创建订单时发生错误，请稍后重试。' });
            setStep('payment');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleQuantityChange = (amount: number) => { setOrderDetails(prev => ({ ...prev, quantity: Math.max(1, prev.quantity + amount) })); };
    
    const resetOrderFlow = () => {
        setOrderDetails({ color: 'bg-white', colorName: 'white', size: 'M', quantity: 1 });
        setShippingInfo({ name: '', address: '', phone: '' });
        setPaymentInfo({ cardNumber: '', expiry: '', cvv: '' });
        setStep('home');
    };

    const handleGoHome = () => {
        setStep('home');
    }
    
    const AppHeader = () => {
        let title = 'POD.STYLE';
        let showBack = false;

        switch(step) {
            case 'profile':
            case 'categorySelection':
                showBack = true;
                break;
        }

        const handleBack = () => {
            if (step === 'profile') {
                setStep('home');
            } else if (step === 'categorySelection') {
                setViewerState(prev => ({ ...prev, isOpen: true, modelIndex: -1 }));
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

              {step !== 'login' && user && (
                <Button variant="ghost" size="icon" className="rounded-full w-9 h-9" onClick={() => user.isAnonymous ? setStep('login') : setStep('profile')}>
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.isAnonymous ? <User size={16} /> : (user?.displayName?.[0] || user?.email?.[0])?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              )}
              { (step === 'login' || !user) && <div className="w-9"></div>}
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
        if (authLoading) {
            return (
              <LoadingScreen>
                <div className="text-center">
                    <h1 className="text-2xl font-medium text-foreground">欢迎来到 POD.STYLE</h1>
                    <p className="mt-4">
                        放飞思想，随心定制
                        <br />
                        <span className="text-sm">Free Your Mind, Customize Your Way.</span>
                    </p>
                </div>
              </LoadingScreen>
            );
        }
        
        switch (step) {
            case 'login': return <LoginScreen />;
            case 'generating': return <LoadingScreen text={loadingText} />;
            case 'categorySelection': return <CategorySelectionScreen />;
            case 'shipping': return <ShippingScreen 
                user={user}
                shippingInfo={shippingInfo} 
                setShippingInfo={setShippingInfo} 
                onNext={() => setStep('payment')} 
                onBack={() => {
                  setStep('home');
                  setViewerState(prev => ({...prev, isOpen: true}));
                }} 
            />;
            case 'payment': return <PaymentScreen 
                orderDetails={orderDetails} 
                paymentInfo={paymentInfo}
                setPaymentInfo={setPaymentInfo} 
                onPay={handlePayment} 
                onBack={() => setStep('shipping')} 
                isLoading={isLoading} 
                price={MOCK_PRICE}
            />;
            case 'confirmation': return <ConfirmationScreen onGoHome={handleGoHome} onReset={resetOrderFlow} category={lastOrderedCategory} />;
            case 'profile': return <ProfileScreen
                user={user}
                creations={creations}
                orders={orders}
                onBack={() => setStep('home')}
                onGoToHistory={goToHistory}
                onSignOut={handleSignOut}
                onDeleteCreation={handleDeleteCreation}
                onLoginRequest={() => setStep('login')}
                onTogglePublic={handleTogglePublic}
            />;
            case 'home':
            default:
                return <HomeScreen
                    prompt={prompt} setPrompt={setPrompt}
                    user={user}
                    uploadedImage={uploadedImage} setUploadedImage={setUploadedImage}
                    onGenerate={handleGeneratePattern}
                    publicCreations={publicCreations}
                    trendingCreations={trendingCreations}
                    onSelectPublicCreation={handleSelectPublicCreation}
                    isLoading={isDataLoading}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    artStyles={artStyles}
                    selectedStyle={selectedStyle}
                    setSelectedStyle={setSelectedStyle}
                />;
        }
    };
    
    const getSourceCreations = () => {
        switch(viewerState.sourceTab) {
            case 'popular':
                return publicCreations;
            case 'trending':
                return trendingCreations;
            case 'mine':
            default:
                return creations;
        }
    };

    return (
        <main className="bg-background text-foreground min-h-screen font-sans flex flex-col items-center justify-center">
            <div className="w-full max-w-md bg-card overflow-hidden shadow-2xl rounded-2xl border" style={{ height: '100dvh' }}>
                <div className="h-full flex flex-col">
                    <AppHeader/>
                    <div className="flex-grow min-h-0">
                        {renderStep()}
                    </div>
                </div>
            </div>

            {viewerState.isOpen && (
              <ViewerScreen
                viewerState={viewerState}
                setViewerState={setViewerState}
                sourceCreations={getSourceCreations()}
                orderDetails={orderDetails}
                setOrderDetails={setOrderDetails}
                handleQuantityChange={handleQuantityChange}
                onNext={() => {
                  setViewerState(prev => ({...prev, isOpen: false}));
                  setStep('shipping');
                }}
                onRegenerate={() => {
                   setViewerState(prev => ({...prev, isOpen: false}));
                   setStep('categorySelection');
                }}
                price={MOCK_PRICE}
              />
            )}
        </main>
    );
};

export default App;
