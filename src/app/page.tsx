"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { generatePatternAction, generateModelAction } from '@/app/actions';

import { useToast } from "@/hooks/use-toast";
import type { OrderDetails, ShippingInfo, PaymentInfo } from '@/lib/types';

import HomeScreen from '@/components/screens/home-screen';
import LoadingScreen from '@/components/screens/loading-screen';
import PatternPreviewScreen from '@/components/screens/pattern-preview-screen';
import MockupScreen from '@/components/screens/mockup-screen';
import ShippingScreen from '@/components/screens/shipping-screen';
import PaymentScreen from '@/components/screens/payment-screen';
import ConfirmationScreen from '@/components/screens/confirmation-screen';
import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AppStep = 'home' | 'generating' | 'patternPreview' | 'mockup' | 'shipping' | 'payment' | 'confirmation';

const App = () => {
    const [step, setStep] = useState<AppStep>('home');
    const [prompt, setPrompt] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [patternHistory, setPatternHistory] = useState<string[]>([]);
    const [modelHistory, setModelHistory] = useState<(string | null)[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [orderDetails, setOrderDetails] = useState<OrderDetails>({ color: 'bg-white', colorName: 'white', size: 'M', quantity: 1 });
    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({ name: '', address: '', phone: '' });
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({ cardNumber: '', expiry: '', cvv: '' });
    const [selectedStyle, setSelectedStyle] = useState('none');
    const { toast } = useToast();

    const handleGeneratePattern = useCallback(async () => {
        if (!prompt && !uploadedImage) {
            toast({ variant: 'destructive', title: '创意不能为空', description: '请输入您的创意想法或上传一张图片！' });
            return;
        }
        setIsLoading(true);
        setLoadingText('正在生成创意图案...');
        setStep('generating');

        try {
            const styleInstruction = selectedStyle !== 'none' ? selectedStyle : undefined;
            const result = await generatePatternAction({
                prompt,
                inspirationImage: uploadedImage ?? undefined,
                style: styleInstruction,
            });

            const newPattern = result.generatedImage;
            const newHistoryIndex = patternHistory.length;
            const newPatternHistory = [...patternHistory, newPattern];
            const newModelHistory = [...modelHistory, null];

            setPatternHistory(newPatternHistory);
            setModelHistory(newModelHistory);
            setHistoryIndex(newHistoryIndex);
            setStep('patternPreview');
        } catch (err: any) {
            console.error(err);
            toast({ variant: 'destructive', title: '图案生成失败', description: err.message || '图案生成过程中发生网络错误。' });
            setStep('home');
        } finally {
            setIsLoading(false);
        }
    }, [prompt, uploadedImage, patternHistory, modelHistory, selectedStyle, toast]);

    const handleGenerateModel = useCallback(async () => {
        if (historyIndex < 0 || !patternHistory[historyIndex]) {
            toast({ variant: 'destructive', title: '操作无效', description: '没有可用的图案来生成模特图。' });
            setStep('home');
            return;
        }
        setIsLoading(true);
        setLoadingText('正在为您生成模特试穿图...');
        setStep('generating');

        try {
            const patternData = patternHistory[historyIndex];
            const result = await generateModelAction({
                patternDataUri: patternData,
                colorName: orderDetails.colorName,
            });

            const updatedModelHistory = [...modelHistory];
            updatedModelHistory[historyIndex] = result.modelImageUri;
setModelHistory(updatedModelHistory);
            setStep('mockup');
        } catch (err: any) {
            console.error(err);
            toast({ variant: 'destructive', title: '模特图生成失败', description: err.message || '模特图生成过程中发生网络错误。' });
            setStep('patternPreview');
        } finally {
            setIsLoading(false);
        }
    }, [historyIndex, patternHistory, modelHistory, orderDetails.colorName, toast]);

    useEffect(() => {
        if (step === 'patternPreview' && patternHistory[historyIndex] && !modelHistory[historyIndex]) {
            // No automatic model generation for now
            // const timer = setTimeout(() => { handleGenerateModel(); }, 3500);
            // return () => clearTimeout(timer);
        }
    }, [step, historyIndex, patternHistory, modelHistory, handleGenerateModel]);

    const navigateHistory = (direction: number) => {
        const newIndex = historyIndex + direction;
        if (newIndex >= 0 && newIndex < patternHistory.length) {
            setHistoryIndex(newIndex);
            if (step === 'mockup' && !modelHistory[newIndex]) {
                setStep('patternPreview');
            }
        }
    };

    const goToHistory = (index: number) => {
        setHistoryIndex(index);
        if (modelHistory[index]) {
            setStep('mockup');
        } else {
            setStep('patternPreview');
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
        setOrderDetails({ color: 'bg-white', colorName: 'white', size: 'M', quantity: 1 });
        setShippingInfo({ name: '', address: '', phone: '' });
        setPaymentInfo({ cardNumber: '', expiry: '', cvv: '' });
    };
    
    const AppHeader = () => (
      <header className="flex items-center justify-between p-4 bg-background">
          <Button variant="ghost" size="icon"><Menu /></Button>
          <h1 className="text-xl font-medium">AI T恤</h1>
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            F
          </div>
      </header>
    );

    const renderStep = () => {
        const generatedPattern = patternHistory[historyIndex];
        const modelImage = modelHistory[historyIndex];
        const isModelGenerating = step === 'patternPreview' && !!generatedPattern && !modelImage;

        switch (step) {
            case 'generating': return <LoadingScreen text={loadingText} />;
            case 'patternPreview': return <PatternPreviewScreen 
                generatedPattern={generatedPattern} 
                onBack={() => setStep('home')} 
                historyIndex={historyIndex} 
                totalHistory={patternHistory.length} 
                onNavigate={navigateHistory} 
                isModelGenerating={isLoading}
                onGoToModel={handleGenerateModel} 
            />;
            case 'mockup': return <MockupScreen 
                modelImage={modelImage} 
                orderDetails={orderDetails} 
                setOrderDetails={setOrderDetails} 
                handleQuantityChange={handleQuantityChange} 
                onNext={() => setStep('shipping')} 
                onBack={() => setStep('patternPreview')} 
                historyIndex={historyIndex} 
                totalHistory={patternHistory.length} 
                onNavigate={navigateHistory} 
            />;
            case 'shipping': return <ShippingScreen 
                shippingInfo={shippingInfo} 
                setShippingInfo={setShippingInfo} 
                onNext={() => setStep('payment')} 
                onBack={() => setStep('mockup')} 
            />;
            case 'payment': return <PaymentScreen 
                orderDetails={orderDetails} 
                paymentInfo={paymentInfo} 
                setPaymentInfo={setPaymentInfo} 
                onPay={handlePayment} 
                onBack={() => setStep('shipping')} 
                isLoading={isLoading} 
            />;
            case 'confirmation': return <ConfirmationScreen onReset={reset} />;
            case 'home':
            default:
                return <HomeScreen
                    prompt={prompt} setPrompt={setPrompt}
                    uploadedImage={uploadedImage} setUploadedImage={setUploadedImage}
                    onGenerate={handleGeneratePattern}
                    orderDetails={orderDetails} setOrderDetails={setOrderDetails}
                    patternHistory={patternHistory} modelHistory={modelHistory}
                    onGoToHistory={goToHistory}
                    selectedStyle={selectedStyle} setSelectedStyle={setSelectedStyle}
                />;
        }
    };

    return (
        <main className="bg-background text-foreground min-h-screen font-sans flex flex-col items-center justify-center">
            <div className="w-full max-w-md bg-card overflow-hidden" style={{ height: '100dvh' }}>
                <div key={`${step}-${historyIndex}`} className="h-full flex flex-col">
                    <AppHeader/>
                    <div className="flex-grow overflow-y-auto">
                        {renderStep()}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default App;
