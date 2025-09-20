
"use client";

import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Minus, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HistoryNavigator from '@/components/ui/history-navigator';
import type { Model, OrderDetails, Creation } from '@/lib/types';
import { useSwipe } from '@/hooks/use-swipe';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface MockupScreenProps {
  modelImage: string | null | undefined;
  models: Model[];
  creation: Creation | undefined;
  orderDetails: OrderDetails;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderDetails>>;
  handleQuantityChange: (amount: number) => void;
  onNext: () => void;
  onBack: () => void;
  creationHistoryIndex: number;
  totalCreations: number;
  onNavigateCreations: (direction: number) => void;
  modelHistoryIndex: number;
  onSelectModel: (index: number) => void;
  category: string;
  onRegenerate: () => void;
}

const MockupScreen = ({
  modelImage, models, creation, orderDetails, setOrderDetails, handleQuantityChange,
  onNext, onBack, creationHistoryIndex, totalCreations, onNavigateCreations,
  modelHistoryIndex, onSelectModel, category, onRegenerate
}: MockupScreenProps) => {
  const onNavigateModels = (direction: number) => {
    const newIndex = modelHistoryIndex + direction;
    if (newIndex >= 0 && newIndex < models.length) {
      onSelectModel(newIndex);
    }
  };
  
  const swipeHandlers = useSwipe({ 
      onSwipeLeft: () => models.length > 1 ? onNavigateModels(1) : onNavigateCreations(1), 
      onSwipeRight: () => models.length > 1 ? onNavigateModels(-1) : onNavigateCreations(-1) 
  });
  
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const isApparel = category.includes("T-shirts") || category.includes("Hoodies") || category.includes("Sweatshirts") || category.includes("T恤") || category.includes("连帽衫") || category.includes("运动卫衣");
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
      
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-full px-4">
        <HistoryNavigator 
          currentIndex={creationHistoryIndex} 
          total={totalCreations} 
          onNavigate={onNavigateCreations} 
          variant="creation"
          summary={creation?.summary}
        />
      </div>


      <div className="bg-background rounded-t-2xl shadow-lg p-6 pt-5 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="text-2xl font-bold">¥ {price}</div>
            
            {models && models.length > 1 && (
              <ScrollArea className="max-w-[70%] whitespace-nowrap rounded-md">
                <div className="flex w-max space-x-2">
                  {models.map((model, index) => (
                    <Button
                      key={index}
                      variant={index === modelHistoryIndex ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSelectModel(index)}
                      className="rounded-full shrink-0"
                    >
                      {model.category.split(' ')[0]}
                    </Button>
                  ))}
                </div>
                 <ScrollBar orientation="horizontal" className="h-0" />
              </ScrollArea>
            )}
          </div>
          

          {isApparel && (
              <div className="my-4">
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
