
"use client";

import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Minus, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HistoryNavigator from '@/components/ui/history-navigator';
import type { OrderDetails } from '@/lib/types';
import { useSwipe } from '@/hooks/use-swipe';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface MockupScreenProps {
  modelImage: string | null | undefined;
  orderDetails: OrderDetails;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderDetails>>;
  handleQuantityChange: (amount: number) => void;
  onNext: () => void;
  onBack: () => void;
  creationHistoryIndex: number;
  totalCreations: number;
  onNavigateCreations: (direction: number) => void;
  modelHistoryIndex: number;
  totalModels: number;
  onNavigateModels: (direction: number) => void;
  category: string;
  onRegenerate: () => void;
}

const MockupScreen = ({
  modelImage, orderDetails, setOrderDetails, handleQuantityChange,
  onNext, onBack, creationHistoryIndex, totalCreations, onNavigateCreations,
  modelHistoryIndex, totalModels, onNavigateModels, category, onRegenerate
}: MockupScreenProps) => {
  const swipeHandlers = useSwipe({ 
      onSwipeLeft: () => totalModels > 1 ? onNavigateModels(1) : onNavigateCreations(1), 
      onSwipeRight: () => totalModels > 1 ? onNavigateModels(-1) : onNavigateCreations(-1) 
  });
  
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const isApparel = category.includes("T-shirts") || category.includes("Hoodies") || category.includes("Sweatshirts");
  const price = 129; 

  return (
    <div className="relative flex flex-col h-full bg-muted" {...swipeHandlers}>
      <div className="flex-grow relative">
        {modelImage ? (
            <Image src={modelImage} alt="商品效果图" layout="fill" className="object-cover animate-fade-in" />
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">正在生成商品效果图...</div>
        )}
         <Button onClick={onBack} variant="ghost" size="icon" className="absolute top-4 left-4 z-10 rounded-full text-white bg-black/20 hover:bg-black/40"><ArrowLeft size={20} /></Button>
         <Button onClick={onRegenerate} variant="ghost" size="icon" className="absolute top-4 right-4 z-10 rounded-full text-white bg-black/20 hover:bg-black/40"><RefreshCw size={18} /></Button>
      </div>
      
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-full px-4 flex flex-col gap-2">
        {totalModels > 1 && (
          <HistoryNavigator 
            currentIndex={modelHistoryIndex} 
            total={totalModels} 
            onNavigate={onNavigateModels} 
            variant="model"
          />
        )}
        
        <HistoryNavigator 
          currentIndex={creationHistoryIndex} 
          total={totalCreations} 
          onNavigate={onNavigateCreations} 
          variant="creation"
        />
      </div>


      <div className="bg-background rounded-t-2xl shadow-lg p-6 pt-5 flex-shrink-0">
          <div className="text-2xl font-bold mb-4">¥ {price}</div>

          {isApparel && (
              <div className="mb-4">
                  <p className="text-sm font-medium mb-2">尺码</p>
                  <div className="flex gap-2">
                      {sizes.map(size => (
                          <Button 
                              key={size} 
                              variant={orderDetails.size === size ? 'default' : 'outline'} 
                              onClick={() => setOrderDetails(prev => ({ ...prev, size }))} 
                              className={cn("rounded-md h-9 w-12 text-base font-semibold", orderDetails.size !== size && "bg-secondary border-secondary hover:bg-muted")}
                          >
                              {size}
                          </Button>
                      ))}
                  </div>
              </div>
          )}

          <Separator className="my-4" />

          <div className="flex justify-between items-center mb-6">
              <p className="text-sm font-medium">数量</p>
              <div className="flex items-center gap-3">
                  <Button variant="secondary" size="icon" className="rounded-full w-8 h-8" onClick={() => handleQuantityChange(-1)}><Minus size={16} /></Button>
                  <span className="font-bold text-lg w-8 text-center">{orderDetails.quantity}</span>
                  <Button variant="secondary" size="icon" className="rounded-full w-8 h-8" onClick={() => handleQuantityChange(1)}><Plus size={16} /></Button>
              </div>
          </div>

          <Button onClick={onNext} size="lg" className="w-full h-12 text-base rounded-full">
              下一步 <ShoppingCart className="ml-2" size={20} />
          </Button>
      </div>
    </div>
  );
};

export default MockupScreen;
