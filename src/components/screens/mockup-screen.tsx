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

      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 flex justify-between items-end">
        <div className="flex flex-col gap-4">
          {isApparel && (
            <div>
              <p className="text-sm font-bold mb-2 text-white/90" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>尺码</p>
              <div className="flex gap-2">
                {sizes.map(size => (
                  <Button 
                    key={size} 
                    variant={orderDetails.size === size ? 'default' : 'outline'} 
                    onClick={() => setOrderDetails(prev => ({ ...prev, size }))} 
                    className={cn(
                      "rounded-full w-12 h-12 text-lg",
                      orderDetails.size === size 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-black/20 text-white border-white/30 hover:bg-white/20 hover:text-white"
                    )}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <p className="text-sm font-bold text-white/90 w-12" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>数量</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="rounded-full bg-black/20 text-white border-white/30 hover:bg-white/20 hover:text-white" onClick={() => handleQuantityChange(-1)}><Minus size={16} /></Button>
              <span className="font-bold text-lg w-8 text-center text-white" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>{orderDetails.quantity}</span>
              <Button variant="outline" size="icon" className="rounded-full bg-black/20 text-white border-white/30 hover:bg-white/20 hover:text-white" onClick={() => handleQuantityChange(1)}><Plus size={16} /></Button>
            </div>
          </div>
        </div>

        <Button onClick={onNext} className="h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
            下一步 <ShoppingCart className="ml-2" size={20} />
        </Button>
      </div>
    </div>
  );
};

export default MockupScreen;
