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

      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 border-t bg-background/80 backdrop-blur-sm rounded-t-2xl">
        <div className="space-y-4">
          {isApparel && (
            <div>
              <h3 className="font-medium mb-2 text-muted-foreground">尺码</h3>
              <div className="flex space-x-2">
                {sizes.map(s => (
                  <Button key={s} onClick={() => setOrderDetails(prev => ({ ...prev, size: s }))}
                    variant={orderDetails.size === s ? 'default' : 'outline'}
                    className="rounded-full">
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="font-medium mb-2 text-muted-foreground">数量</h3>
            <div className="flex items-center bg-secondary rounded-full w-fit">
              <Button onClick={() => handleQuantityChange(-1)} variant="ghost" size="icon" className="rounded-full"><Minus size={16} /></Button>
              <span className="px-4 font-medium">{orderDetails.quantity}</span>
              <Button onClick={() => handleQuantityChange(1)} variant="ghost" size="icon" className="rounded-full"><Plus size={16} /></Button>
            </div>
          </div>
        </div>
        <Button onClick={onNext} className="mt-6 w-full rounded-full">
          <span>下一步：填写地址</span>
        </Button>
      </div>
    </div>
  );
};

export default MockupScreen;
