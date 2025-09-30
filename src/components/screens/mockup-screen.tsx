
"use client";

import React from 'react';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholders';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Model, OrderDetails } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface MockupScreenProps {
  modelImage: string | null | undefined;
  models: Model[];
  orderDetails: OrderDetails;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderDetails>>;
  handleQuantityChange: (amount: number) => void;
  onNext: () => void;
  modelHistoryIndex: number;
  onNavigateModels: (index: number) => void;
  category: string;
  price: number;
}

const MockupScreen = ({
  modelImage, models, orderDetails, setOrderDetails, handleQuantityChange,
  onNext, modelHistoryIndex, onNavigateModels, category, price
}: MockupScreenProps) => {
  
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const isApparel = category.includes("T-shirts") || category.includes("Hoodies") || category.includes("Sweatshirts") || category.includes("T恤") || category.includes("连帽衫") || category.includes("运动卫衣");

  return (
    <div 
      className="relative flex flex-col h-full bg-muted"
    >
      <div className="flex-grow relative">
        {modelImage ? (
            <FirebaseImage
              src={modelImage}
              alt="商品效果图"
              fill
              className="object-cover animate-fade-in"
              priority
              placeholder="blur"
              blurDataURL={IMAGE_PLACEHOLDER}
              sizes="100vh"
            />
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">正在生成商品效果图...</div>
        )}
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
                      onClick={() => onNavigateModels(index)}
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
