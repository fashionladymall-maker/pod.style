
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useDrag } from '@use-gesture/react';
import { ArrowLeft, Heart, MessageCircle, Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Creation, OrderDetails } from '@/lib/types';
import type { ViewerState } from '@/app/app-client';
import PatternPreviewScreen from './pattern-preview-screen';
import MockupScreen from './mockup-screen';
import { useToast } from '@/hooks/use-toast';

interface ViewerScreenProps {
  viewerState: ViewerState;
  setViewerState: React.Dispatch<React.SetStateAction<ViewerState>>;
  sourceCreations: Creation[];
  orderDetails: OrderDetails;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderDetails>>;
  handleQuantityChange: (amount: number) => void;
  onNext: () => void;
  onGoToCategorySelection: () => void;
  price: number;
}

const ViewerScreen: React.FC<ViewerScreenProps> = ({
  viewerState,
  setViewerState,
  sourceCreations,
  orderDetails,
  setOrderDetails,
  handleQuantityChange,
  onNext,
  onGoToCategorySelection,
  price,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const flatNavigationMap = useMemo(() => {
    if (!sourceCreations) return [];
    const map: { creationId: string, modelIndex: number }[] = [];
    sourceCreations.forEach((creation) => {
      map.push({ creationId: creation.id, modelIndex: -1 }); // The pattern itself
      creation.models.forEach((_, mIndex) => {
        map.push({ creationId: creation.id, modelIndex: mIndex });
      });
    });
    return map;
  }, [sourceCreations]);
  
  const handleClose = () => {
    setViewerState(prev => ({ ...prev, isOpen: false }));
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (isNavigating || flatNavigationMap.length <= 1) return;
  
    const currentIndex = flatNavigationMap.findIndex(
      item => item.creationId === viewerState.creationId && item.modelIndex === viewerState.modelIndex
    );
  
    if (currentIndex === -1) return;
  
    let newIndex = currentIndex + (direction === 'next' ? 1 : -1);

    // Loop navigation
    if (newIndex < 0) {
        newIndex = flatNavigationMap.length - 1;
    } else if (newIndex >= flatNavigationMap.length) {
        newIndex = 0;
    }
  
    if (newIndex >= 0 && newIndex < flatNavigationMap.length) {
      setIsNavigating(true);
      const nextItem = flatNavigationMap[newIndex];
      setViewerState(prev => ({
        ...prev,
        creationId: nextItem.creationId,
        modelIndex: nextItem.modelIndex,
      }));
      setTimeout(() => setIsNavigating(false), 500); // Cooldown
    }
  };
  
  const onSelectModel = (index: number) => {
    const targetIndex = flatNavigationMap.findIndex(
      item => item.creationId === viewerState.creationId && item.modelIndex === index
    );
    if(targetIndex !== -1) {
        const targetItem = flatNavigationMap[targetIndex];
        setViewerState(prev => ({ 
            ...prev,
            creationId: targetItem.creationId,
            modelIndex: targetItem.modelIndex 
        }));
    }
  }

  const currentCreation = sourceCreations.find(c => c.id === viewerState.creationId);
  const isPatternView = viewerState.modelIndex === -1;
  const currentModel = !isPatternView ? currentCreation?.models[viewerState.modelIndex] : undefined;

  const bind = useDrag(
    ({ last, swipe: [, swipeY] }) => {
      if (last && !isNavigating) {
        if (swipeY === -1) { // Swipe Up
          handleNavigate('next');
        } else if (swipeY === 1) { // Swipe Down
          handleNavigate('prev');
        }
      }
    },
    {
      axis: 'y',
      swipe: { distance: 50, velocity: 0.3 },
    }
  );

  const handleSocialClick = (action: string) => {
    toast({
      title: `功能开发中`,
      description: `“${action}”功能即将上线，敬请期待！`,
    });
  };

  const renderContent = () => {
    if (!currentCreation) {
      return null;
    }
    
    if (isPatternView) {
      return (
        <PatternPreviewScreen
          creation={currentCreation}
          isModelGenerating={false}
          onGoToModel={onGoToCategorySelection}
        />
      );
    }
    
    return (
      <MockupScreen
        modelImage={currentModel?.uri}
        models={currentCreation.models || []}
        orderDetails={orderDetails}
        setOrderDetails={setOrderDetails}
        handleQuantityChange={handleQuantityChange}
        onNext={onNext}
        modelHistoryIndex={viewerState.modelIndex}
        onNavigateModels={onSelectModel}
        category={currentModel?.category || ''}
        onRegenerate={onGoToCategorySelection}
        price={price}
      />
    );
  };


  const content = (
    <div
      {...bind()}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      style={{ touchAction: 'pan-y' }}
    >
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center p-4 bg-gradient-to-b from-black/30 to-transparent">
        <Button onClick={handleClose} variant="ghost" size="icon" className="rounded-full text-white bg-black/20 hover:bg-black/40">
          <ArrowLeft size={20} />
        </Button>
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        <Button onClick={() => handleSocialClick('点赞')} variant="ghost" size="icon" className="rounded-full text-white bg-black/20 hover:bg-black/40 h-10 w-10">
          <Heart size={22} />
        </Button>
        <Button onClick={() => handleSocialClick('评论')} variant="ghost" size="icon" className="rounded-full text-white bg-black/20 hover:bg-black/40 h-10 w-10">
          <MessageCircle size={22} />
        </Button>
        <Button onClick={() => handleSocialClick('收藏')} variant="ghost" size="icon" className="rounded-full text-white bg-black/20 hover:bg-black/40 h-10 w-10">
          <Star size={22} />
        </Button>
        <Button onClick={() => handleSocialClick('转发')} variant="ghost" size="icon" className="rounded-full text-white bg-black/20 hover:bg-black/40 h-10 w-10">
          <Send size={22} />
        </Button>
      </div>

      <div className="flex-grow relative w-full h-full">
        {renderContent()}
      </div>
    </div>
  );

  if (!isMounted) {
    return null;
  }

  return ReactDOM.createPortal(content, document.body);
};

export default ViewerScreen;
