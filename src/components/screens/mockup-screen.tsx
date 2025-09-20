"use client";

import Image from 'next/image';
import { ArrowLeft, Ruler, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HistoryNavigator from '@/components/ui/history-navigator';
import type { OrderDetails } from '@/lib/types';
import { useSwipe } from '@/hooks/use-swipe';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MockupScreenProps {
  modelImage: string | null;
  orderDetails: OrderDetails;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderDetails>>;
  handleQuantityChange: (amount: number) => void;
  onNext: () => void;
  onBack: () => void;
  historyIndex: number;
  totalHistory: number;
  onNavigate: (direction: number) => void;
  category: string;
}

const MockupScreen = ({
  modelImage, orderDetails, setOrderDetails, handleQuantityChange,
  onNext, onBack, historyIndex, totalHistory, onNavigate, category
}: MockupScreenProps) => {
  const swipeHandlers = useSwipe({ onSwipeLeft: () => onNavigate(1), onSwipeRight: () => onNavigate(-1) });
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const isApparel = category.includes("T-shirts") || category.includes("Hoodies") || category.includes("Sweatshirts");


  return (
    <div className="relative flex flex-col h-full bg-background" {...swipeHandlers}>
      <div className="flex-grow relative bg-muted/30">
        {modelImage ? (
            <Image src={modelImage} alt="模特效果图" layout="fill" className="object-cover animate-fade-in" />
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">正在生成模特图...</div>
        )}
      </div>

      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/30 to-transparent">
        <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full text-white bg-black/20 hover:bg-black/40"><ArrowLeft size={20} /></Button>
      </div>
      
      <HistoryNavigator currentIndex={historyIndex} total={totalHistory} onNavigate={onNavigate} />

      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 border-t bg-background/5 backdrop-blur-sm rounded-t-2xl">
        {isApparel && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2 text-foreground/80">尺码</p>
            <div className="flex justify-center gap-2">
              {sizes.map(size => (
                <Button key={size} variant={orderDetails.size === size ? 'default' : 'outline'} onClick={() => setOrderDetails(prev => ({ ...prev, size }))} className="rounded-full w-12 h-12">
                  {size}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-foreground/80">数量</p>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => handleQuantityChange(-1)}><Minus size={16} /></Button>
            <span className="font-medium text-lg w-8 text-center">{orderDetails.quantity}</span>
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => handleQuantityChange(1)}><Plus size={16} /></Button>
          </div>
        </div>

        <Button onClick={onNext} className="w-full h-12 rounded-full">
            下一步：填写地址 <ShoppingCart className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default MockupScreen;
