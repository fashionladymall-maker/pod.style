
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Minus, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Model, OrderDetails, Creation } from '@/lib/types';
import { useDrag } from '@use-gesture/react';
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
  price: number;
}

const MockupScreen = ({
  modelImage, models, creation, orderDetails, setOrderDetails, handleQuantityChange,
  onNext, onBack, creationHistoryIndex, totalCreations, onNavigateCreations,
  modelHistoryIndex, onSelectModel, category, onRegenerate, price
}: MockupScreenProps) => {
  const [isNavigating, setIsNavigating] = useState(false);
  
  const onNavigateModels = (direction: number) => {
    const newIndex = modelHistoryIndex + direction;
    if (newIndex >= 0 && newIndex < models.length) {
      onSelectModel(newIndex);
    }
  };
  
  const bind = useDrag(
    ({ last, swipe: [, swipeY], axis }) => {
      if (last && !isNavigating) {
        const isVerticalSwipe = Math.abs(swipeY) > 0;
        
        if (isVerticalSwipe && models.length > 1) { // Vertical swipe for models
          if (swipeY === -1) { // Swipe Up
            setIsNavigating(true);
            onNavigateModels(1);
            setTimeout(() => setIsNavigating(false), 500);
          } else if (swipeY === 1) { // Swipe Down
            setIsNavigating(true);
            onNavigateModels(-1);
            setTimeout(() => setIsNavigating(false), 500);
          }
        }
      }
    },
    {
      axis: 'y',
      swipe: { distance: 40, velocity: 0.4 },
    }
  );
  
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const isApparel = category.includes("T-shirts") || category.includes("Hoodies") || category.includes("Sweatshirts") || category.includes("T恤") || category.includes("连帽衫") || category.includes("运动卫衣");

  return (
    <div 
      {...bind()} 
      className="relative flex flex-col h-full bg-muted"
      style={{ touchAction: 'none' }}
    >
      <div className="flex-grow relative">
        {modelImage ? (
            <Image src={modelImage} alt="商品效果图" layout="fill" className="object-cover animate-fade-in" />
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">正在生成商品效果图...</div>
        )}
         <Button onClick={onBack} variant="ghost" size="icon" className="absolute top-4 left-4 z-10 rounded-full text-white bg-black/20 hover:bg-black/40"><ArrowLeft size={20} /></Button>
         <Button onClick={onRegenerate} variant="ghost" size="icon" className="absolute top-4 right-4 z-10 rounded-full text-white bg-black/20 hover:bg-black/40"><RefreshCw size={18} /></Button>
      </div>
      

      <div className="absolute bottom-0 left-0 right-0 p-4 pt-6 text-white bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex justify-between items-center mb-2">
            <div className="text-xl font-bold">¥ {price}</div>
            
            {models && models.length > 0 && (
              <ScrollArea className="max-w-[70%] whitespace-nowrap rounded-md">
                <div className="flex w-max space-x-2">
                  {models.map((model, index) => (
                    <Button
                      key={index}
                      variant={index === modelHistoryIndex ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSelectModel(index)}
                      className={cn(
                        "rounded-full shrink-0",
                        index !== modelHistoryIndex && "bg-white/10 border-white/20 text-white hover:bg-white/20"
                      )}
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
              <div className="my-2">
                  <p className="text-xs font-medium mb-1">尺码</p>
                  <div className="flex gap-2">
                      {sizes.map(size => (
                          <Button 
                              key={size} 
                              variant={orderDetails.size === size ? 'default' : 'outline'} 
                              onClick={() => setOrderDetails(prev => ({ ...prev, size }))} 
                              className={cn(
                                "rounded-md h-8 w-10 text-sm font-semibold", 
                                orderDetails.size !== size && "bg-white/10 border-white/20 text-white hover:bg-white/20"
                              )}
                          >
                              {size}
                          </Button>
                      ))}
                  </div>
              </div>
          )}

          <Separator className="my-2 bg-white/20" />

          <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-medium">数量</p>
              <div className="flex items-center gap-2">
                  <Button variant="secondary" size="icon" className="rounded-full w-7 h-7 bg-white/10 text-white hover:bg-white/20" onClick={() => handleQuantityChange(-1)}><Minus size={14} /></Button>
                  <span className="font-bold text-base w-6 text-center">{orderDetails.quantity}</span>
                  <Button variant="secondary" size="icon" className="rounded-full w-7 h-7 bg-white/10 text-white hover:bg-white/20" onClick={() => handleQuantityChange(1)}><Plus size={14} /></Button>
              </div>
          </div>

          <Button onClick={onNext} size="lg" className="w-full h-11 text-base rounded-full bg-blue-500 hover:bg-blue-600 text-white">
              下一步 <ShoppingCart className="ml-2" size={20} />
          </Button>
      </div>
    </div>
  );
};

export default MockupScreen;
