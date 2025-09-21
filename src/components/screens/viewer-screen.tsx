
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useDrag } from '@use-gesture/react';
import { ArrowLeft, Heart, MessageCircle, Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Creation, OrderDetails, FirebaseUser } from '@/lib/types';
import type { ViewerState } from '@/app/app-client';
import PatternPreviewScreen from './pattern-preview-screen';
import MockupScreen from './mockup-screen';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import CommentsSheet from '../sheets/comments-sheet';

interface ViewerScreenProps {
  user: FirebaseUser | null;
  viewerState: ViewerState;
  setViewerState: React.Dispatch<React.SetStateAction<ViewerState>>;
  sourceCreations: Creation[];
  orderDetails: OrderDetails;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderDetails>>;
  handleQuantityChange: (amount: number) => void;
  onNext: () => void;
  onGoToCategorySelection: () => void;
  price: number;
  onLikeToggle: (creationId: string, userId: string, isLiked: boolean) => Promise<{ success: boolean }>;
  onFavoriteToggle: (creationId: string, userId: string, isFavorited: boolean) => Promise<{ success: boolean }>;
  onShare: (creationId: string) => Promise<{ success: boolean }>;
  onUpdateCreation: (creation: Creation) => void;
}

const ViewerScreen: React.FC<ViewerScreenProps> = ({
  user,
  viewerState,
  setViewerState,
  sourceCreations,
  orderDetails,
  setOrderDetails,
  handleQuantityChange,
  onNext,
  onGoToCategorySelection,
  price,
  onLikeToggle,
  onFavoriteToggle,
  onShare,
  onUpdateCreation,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const { toast } = useToast();

  const currentCreation = useMemo(() => 
    sourceCreations.find(c => c.id === viewerState.creationId)
  , [sourceCreations, viewerState.creationId]);

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
      setTimeout(() => setIsNavigating(false), 500);
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

  const isPatternView = viewerState.modelIndex === -1;
  const currentModel = !isPatternView ? currentCreation?.models[viewerState.modelIndex] : undefined;

  const bind = useDrag(
    ({ last, swipe: [, swipeY] }) => {
      if (last && !isNavigating) {
        if (swipeY === -1) {
          handleNavigate('next');
        } else if (swipeY === 1) {
          handleNavigate('prev');
        }
      }
    },
    {
      axis: 'y',
      swipe: { distance: 50, velocity: 0.3 },
    }
  );

  const formatCount = (count: number) => {
    if (count < 1000) return count;
    if (count < 1000000) return (count / 1000).toFixed(1) + 'k';
    return (count / 1000000).toFixed(1) + 'm';
  }

  const handleLike = async () => {
    if (!user || !currentCreation) return;
    const isLiked = currentCreation.likedBy.includes(user.uid);
    
    // Optimistic update
    const updatedCreation = {
        ...currentCreation,
        likeCount: isLiked ? currentCreation.likeCount - 1 : currentCreation.likeCount + 1,
        likedBy: isLiked 
            ? currentCreation.likedBy.filter(uid => uid !== user.uid)
            : [...currentCreation.likedBy, user.uid]
    };
    onUpdateCreation(updatedCreation);

    await onLikeToggle(currentCreation.id, user.uid, isLiked);
  };
  
  const handleFavorite = async () => {
    if (!user || !currentCreation) return;
    const isFavorited = currentCreation.favoritedBy.includes(user.uid);

    const updatedCreation = {
        ...currentCreation,
        favoriteCount: isFavorited ? currentCreation.favoriteCount - 1 : currentCreation.favoriteCount + 1,
        favoritedBy: isFavorited
            ? currentCreation.favoritedBy.filter(uid => uid !== user.uid)
            : [...currentCreation.favoritedBy, user.uid]
    };
    onUpdateCreation(updatedCreation);

    await onFavoriteToggle(currentCreation.id, user.uid, isFavorited);
  };

  const handleShare = async () => {
    if (!currentCreation) return;
    if (navigator.share) {
        navigator.share({
            title: '看看我的AI新创作！',
            text: `我用POD.STYLE创作了“${currentCreation.prompt}”`,
            url: window.location.href, // This should be a deep link to the creation in a real app
        })
        .then(() => {
            onShare(currentCreation.id);
            const updatedCreation = { ...currentCreation, shareCount: currentCreation.shareCount + 1 };
            onUpdateCreation(updatedCreation);
        })
        .catch(console.error);
    } else {
        toast({ title: '分享功能需要支持的浏览器' });
    }
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

  const isLiked = user && currentCreation ? currentCreation.likedBy.includes(user.uid) : false;
  const isFavorited = user && currentCreation ? currentCreation.favoritedBy.includes(user.uid) : false;

  const socialButtonClass = "flex flex-col items-center text-white text-xs font-semibold gap-1";
  const iconButtonClass = "flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 h-12 w-12";

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
        <button onClick={handleLike} className={socialButtonClass}>
            <div className={iconButtonClass}>
                <Heart size={26} className={cn("transition-colors", isLiked && "fill-red-500 text-red-500")} />
            </div>
            <span>{currentCreation && formatCount(currentCreation.likeCount)}</span>
        </button>
        <button onClick={() => setIsCommentsOpen(true)} className={socialButtonClass}>
            <div className={iconButtonClass}>
                <MessageCircle size={26} />
            </div>
            <span>{currentCreation && formatCount(currentCreation.commentCount)}</span>
        </button>
        <button onClick={handleFavorite} className={socialButtonClass}>
            <div className={iconButtonClass}>
                <Star size={26} className={cn("transition-colors", isFavorited && "fill-yellow-400 text-yellow-400")} />
            </div>
             <span>{currentCreation && formatCount(currentCreation.favoriteCount)}</span>
        </button>
        <button onClick={handleShare} className={socialButtonClass}>
            <div className={iconButtonClass}>
                <Send size={26} />
            </div>
            <span>{currentCreation && formatCount(currentCreation.shareCount)}</span>
        </button>
      </div>

      <div className="flex-grow relative w-full h-full">
        {renderContent()}
      </div>

      {currentCreation && (
        <CommentsSheet
            isOpen={isCommentsOpen}
            onOpenChange={setIsCommentsOpen}
            creation={currentCreation}
            user={user}
            onCommentAdded={(newComment) => {
                const updatedCreation = {
                    ...currentCreation,
                    commentCount: currentCreation.commentCount + 1,
                };
                onUpdateCreation(updatedCreation);
            }}
        />
      )}
    </div>
  );

  if (!isMounted) {
    return null;
  }

  return ReactDOM.createPortal(content, document.body);
};

export default ViewerScreen;
