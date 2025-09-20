

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { generatePatternAction, generateModelAction, getCreationsAction, deleteCreationAction } from '@/app/actions';

import { useToast } from "@/hooks/use-toast";
import type { OrderDetails, ShippingInfo, PaymentInfo, FirebaseUser, Creation } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";


import HomeScreen from '@/components/screens/home-screen';
import LoadingScreen from '@/components/screens/loading-screen';
import PatternPreviewScreen from '@/components/screens/pattern-preview-screen';
import MockupScreen from '@/components/screens/mockup-screen';
import ShippingScreen from '@/components/screens/shipping-screen';
import PaymentScreen from '@/components/screens/payment-screen';
import ConfirmationScreen from '@/components/screens/confirmation-screen';
import ProfileScreen from '@/components/screens/profile-screen';
import LoginScreen from '@/components/screens/login-screen';
import { Menu, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


export type AppStep = 'home' | 'generating' | 'patternPreview' | 'categorySelection' | 'mockup' | 'shipping' | 'payment' | 'confirmation' | 'profile' | 'login';

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


const App = () => {
    const [step, setStep] = useState<AppStep>('login');
    const [prompt, setPrompt] = useState('');
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [creations, setCreations]  = useState<Creation[]>([]);
    const [activeCreationIndex, setActiveCreationIndex] = useState(-1);
    const [activeModelIndex, setActiveModelIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [orderDetails, setOrderDetails] = useState<OrderDetails>({ color: 'bg-white', colorName: 'white', size: 'M', quantity: 1 });
    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({ name: '', address: '', phone: '' });
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({ cardNumber: '', expiry: '', cvv: '' });
    const [selectedStyle, setSelectedStyle] = useState(artStyles[0]);
    const { toast } = useToast();

    const fetchCreations = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const userCreations = await getCreationsAction(userId);
            setCreations(userCreations);
        } catch (error) {
            console.error("Failed to fetch creations:", error);
            toast({ variant: "destructive", title: "获取作品失败", description: "加载您的作品时发生错误。" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setAuthLoading(false);
            if (!firebaseUser) {
                setStep('login');
                setCreations([]);
            } else {
                setStep('home');
                fetchCreations(firebaseUser.uid);
            }
        });
        return () => unsubscribe();
    }, [fetchCreations]);

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
            setActiveCreationIndex(0);
            setActiveModelIndex(-1);
            setStep('patternPreview');
        } catch (err: any) {
            console.error(err);
            toast({ variant: 'destructive', title: '图案生成失败', description: err.message || '图案生成过程中发生网络错误。' });
            setStep('home');
        } finally {
            setIsLoading(false);
        }
    }, [prompt, uploadedImage, selectedStyle, user, creations, toast]);

    const handleGenerateModel = useCallback(async (category: string) => {
        const activeCreation = creations[activeCreationIndex];
        if (!user || !activeCreation) {
            toast({ variant: 'destructive', title: '操作无效', description: '没有可用的图案来生成模特图。' });
            setStep('home');
            return;
        }
        setIsLoading(true);
        setLoadingText('正在为您生成商品效果图...');
        setStep('generating');

        try {
            const updatedCreation = await generateModelAction({
                creationId: activeCreation.id,
                userId: user.uid,
                patternDataUri: activeCreation.patternUri,
                colorName: orderDetails.colorName,
                category: category,
            });

            const updatedCreations = creations.map((c, index) => 
                index === activeCreationIndex ? updatedCreation : c
            );
            setCreations(updatedCreations);
            // Set the active model to the newly created one
            setActiveModelIndex(updatedCreation.models.length - 1);
            setStep('mockup');
        } catch (err: any) {
            console.error(err);
            toast({ variant: 'destructive', title: '效果图生成失败', description: err.message || '效果图生成过程中发生网络错误。' });
            setStep('categorySelection');
        } finally {
            setIsLoading(false);
        }
    }, [activeCreationIndex, creations, orderDetails.colorName, user, toast]);

    const handleDeleteCreation = useCallback(async (creationId: string) => {
        const originalCreations = creations;
        const newCreations = creations.filter(c => c.id !== creationId);
        setCreations(newCreations); // Optimistic update

        try {
            await deleteCreationAction(creationId);
            toast({ title: "删除成功", description: "您的作品已被删除。" });
            if (activeCreationIndex >= newCreations.length) {
                setActiveCreationIndex(Math.max(0, newCreations.length - 1));
            }
            if (newCreations.length === 0) {
                setStep('home');
            }
        } catch (error) {
            console.error("Failed to delete creation:", error);
            toast({ variant: "destructive", title: "删除失败", description: "无法删除您的作品，请重试。" });
            setCreations(originalCreations); // Revert on failure
        }
    }, [creations, toast, activeCreationIndex]);

    const navigateCreationHistory = (direction: number) => {
        const newIndex = activeCreationIndex + direction;
        if (newIndex >= 0 && newIndex < creations.length) {
            setActiveCreationIndex(newIndex);
            setActiveModelIndex(-1); // Reset model index when changing creation
            const newCreation = creations[newIndex];
             if (step === 'mockup' && newCreation.models.length === 0) {
                setStep('categorySelection');
            } else if (newCreation.models.length > 0) {
                 setActiveModelIndex(0);
                 setStep('mockup');
            } else {
                setStep('patternPreview');
            }
        }
    };
    
    const selectModel = (index: number) => {
      if (index >=0 && creations[activeCreationIndex]?.models[index]) {
        setActiveModelIndex(index);
      }
    }


    const goToHistory = (creationIndex: number, modelIndex: number = -1) => {
        setActiveCreationIndex(creationIndex);
        const creation = creations[creationIndex];
        if (modelIndex > -1 && creation.models[modelIndex]) {
            setActiveModelIndex(modelIndex);
            setStep('mockup');
        } else if (creation.models.length > 0) {
            setActiveModelIndex(0);
            setStep('mockup');
        } else {
            setActiveModelIndex(-1);
            setStep('patternPreview');
        }
    };

    const handleSignOut = async () => {
        try {
            await firebaseSignOut(auth);
            setStep('login');
            reset();
        } catch (error) {
            console.error("Error signing out:", error);
            toast({ variant: "destructive", title: "退出登录失败", description: "退出时发生错误，请稍后重试。" });
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
        setStep('confirmation');
    };
    
    const handleQuantityChange = (amount: number) => { setOrderDetails(prev => ({ ...prev, quantity: Math.max(1, prev.quantity + amount) })); };
    
    const reset = () => {
        setStep('home');
        setPrompt('');
        setUploadedImage(null);
        setCreations([]);
        setActiveCreationIndex(-1);
        setActiveModelIndex(-1);
        setOrderDetails({ color: 'bg-white', colorName: 'white', size: 'M', quantity: 1 });
        setShippingInfo({ name: '', address: '', phone: '' });
        setPaymentInfo({ cardNumber: '', expiry: '', cvv: '' });
    };
    
    const AppHeader = () => {
        let title = 'AIPOD';
        let showBack = false;

        switch(step) {
            case 'profile':
                title = '个人中心';
                showBack = true;
                break;
            case 'categorySelection':
                title = '选择商品类型';
                showBack = true;
                break;
            // Add other cases if needed
        }

        const handleBack = () => {
            if (step === 'categorySelection') {
                setStep('patternPreview');
            } else if (step === 'profile') {
                setStep('home');
            } else {
                setStep('home');
            }
        }

        return (
          <header className="flex items-center justify-between p-4 bg-background border-b">
              {showBack ? (
                  <Button variant="ghost" size="icon" onClick={handleBack}><ArrowLeft /></Button>
              ) : (
                  <Button variant="ghost" size="icon"><Menu /></Button>
              )}
              
              <Button variant="ghost" onClick={() => setStep('home')} className="p-0 h-auto">
                  <h1 className="text-lg font-medium">{title}</h1>
              </Button>

              {step !== 'profile' ? (
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setStep('profile')}>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.isAnonymous ? <User size={20}/> : (user?.displayName?.[0] || user?.email?.[0])?.toUpperCase() || <User size={20} />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              ) : (
                 <div className="w-10"></div> // Placeholder for spacing
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
        if (authLoading) {
            return <LoadingScreen text="正在验证您的身份..." />;
        }
        
        const activeCreation = creations[activeCreationIndex];
        const activeModel = activeCreation?.models[activeModelIndex];

        switch (step) {
            case 'login': return <LoginScreen />;
            case 'generating': return <LoadingScreen text={loadingText} />;
            case 'patternPreview': return <PatternPreviewScreen 
                generatedPattern={activeCreation?.patternUri}
                onBack={() => setStep('home')} 
                creationHistoryIndex={activeCreationIndex} 
                totalCreations={creations.length} 
                onNavigateCreations={navigateCreationHistory} 
                isModelGenerating={isLoading}
                onGoToModel={() => setStep('categorySelection')} 
            />;
            case 'categorySelection': return <CategorySelectionScreen />;
            case 'mockup': return <MockupScreen 
                modelImage={activeModel?.uri}
                models={activeCreation?.models || []}
                orderDetails={orderDetails} 
                setOrderDetails={setOrderDetails} 
                handleQuantityChange={handleQuantityChange} 
                onNext={() => setStep('shipping')} 
                onBack={() => {
                  setActiveModelIndex(-1);
                  setStep('patternPreview');
                }} 
                creationHistoryIndex={activeCreationIndex} 
                totalCreations={creations.length} 
                onNavigateCreations={navigateCreationHistory}
                modelHistoryIndex={activeModelIndex}
                onSelectModel={selectModel}
                category={activeModel?.category || ''}
                onRegenerate={() => setStep('categorySelection')}
            />;
            case 'shipping': return <ShippingScreen 
                shippingInfo={shippingInfo} 
                setShippingInfo={setShippingInfo} 
                onNext={() => setStep('payment')} 
                onBack={() => setStep('mockup')} 
            />;
            case 'payment': return <PaymentScreen 
                orderDetails={orderDetails} 
                paymentInfo={paymentInfo}                 setPaymentInfo={setPaymentInfo} 
                onPay={handlePayment} 
                onBack={() => setStep('shipping')} 
                isLoading={isLoading} 
            />;
            case 'confirmation': return <ConfirmationScreen onReset={reset} />;
            case 'profile': return <ProfileScreen
                user={user}
                creations={creations}
                onBack={() => setStep('home')}
                onGoToHistory={goToHistory}
                onSignOut={handleSignOut}
                onDeleteCreation={handleDeleteCreation}
            />;
            case 'home':
            default:
                return <HomeScreen
                    prompt={prompt} setPrompt={setPrompt}
                    user={user}
                    uploadedImage={uploadedImage} setUploadedImage={setUploadedImage}
                    onGenerate={handleGeneratePattern}
                    creations={creations}
                    onGoToHistory={goToHistory}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    artStyles={artStyles}
                    selectedStyle={selectedStyle}
                    setSelectedStyle={setSelectedStyle}
                />;
        }
    };

    return (
        <main className="bg-background text-foreground min-h-screen font-sans flex flex-col items-center justify-center">
            <div className="w-full max-w-md bg-card overflow-hidden shadow-2xl rounded-2xl border" style={{ height: '100dvh' }}>
                <div key={`${step}-${activeCreationIndex}-${activeModelIndex}`} className="h-full flex flex-col">
                    {step !== 'login' && <AppHeader/>}
                    <div className="flex-grow overflow-y-auto">
                        {renderStep()}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default App;
