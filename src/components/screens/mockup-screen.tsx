"use client";

import Image from 'next/image';
import { ArrowLeft, Ruler, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HistoryNavigator from '@/components/ui/history-navigator';
import type { OrderDetails } from '@/lib/types';
import { useSwipe } from '@/hooks/use-swipe';
import { cn } from '@/lib/utils';

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
}

const MockupScreen = ({
  modelImage, orderDetails, setOrderDetails, handleQuantityChange,
  onNext, onBack, historyIndex, totalHistory, onNavigate
}: MockupScreenProps) => {
  const swipeHandlers = useSwipe({ onSwipeLeft: () => onNavigate(1), onSwipeRight: () => onNavigate(-1) });
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="relative h-full w-full" {...swipeHandlers}>
      {modelImage && <Image src={modelImage} alt="模特效果图" layout="fill" className="absolute inset-0 w-full h-full object-cover animate-scale-in" />}
      
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center bg-gradient-to-b from-black/70 to-transparent animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full bg-black/30 hover:bg-black/60 transition-colors transform hover:scale-110"><ArrowLeft size={20} /></Button>
        <h2 className="text-xl font-bold mx-auto text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}>第二步：预览与定制</h2>
        <div className="w-9 h-9"></div>
      </div>
      
      <HistoryNavigator currentIndex={historyIndex} total={totalHistory} onNavigate={onNavigate} />
      
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black/80 to-transparent animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2 flex items-center text-primary"><Ruler size={18} className="mr-2" />尺码</h3>
            <div className="flex space-x-2">
              {sizes.map(s => (
                <Button key={s} onClick={() => setOrderDetails(prev => ({ ...prev, size: s }))}
                  variant={orderDetails.size === s ? 'default' : 'secondary'}
                  className={cn("rounded-full transition-all duration-200 transform hover:scale-110", orderDetails.size === s && "bg-primary")}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center text-primary"><ShoppingCart size={18} className="mr-2" />数量</h3>
            <div className="flex items-center bg-black/40 rounded-full w-fit">
              <Button onClick={() => handleQuantityChange(-1)} variant="ghost" size="icon" className="rounded-full hover:bg-white/20 transition-colors transform hover:scale-110"><Minus size={16} /></Button>
              <span className="px-4 font-bold text-white">{orderDetails.quantity}</span>
              <Button onClick={() => handleQuantityChange(1)} variant="ghost" size="icon" className="rounded-full hover:bg-white/20 transition-colors transform hover:scale-110"><Plus size={16} /></Button>
            </div>
          </div>
        </div>
        <Button onClick={onNext} className="mt-6 w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold py-3 px-4 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-100">
          <span>下一步：填写地址</span>
        </Button>
      </div>
    </div>
  );
};

export default MockupScreen;
