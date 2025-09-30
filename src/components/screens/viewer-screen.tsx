
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useDrag } from '@use-gesture/react';
import { ArrowLeft, Heart, MessageCircle, Star, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Creation, OrderDetails, FirebaseUser } from '@/lib/types';
import type { ViewerState } from '@/app/app-client';
import PatternPreviewScreen from './pattern-preview-screen';
import MockupScreen from './mockup-screen';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import CommentsSheet from '../sheets/comments-sheet';
import { logCreationInteractionAction } from '@/server/actions';

interface ViewerScreenProps {
  user: FirebaseUser | null;
  viewerState: ViewerState;
  setViewerState: React.Dispatch<React.SetStateAction<ViewerState>>;
  sourceCreations: Creation[];
  orderDetails: OrderDetails;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderDetails>>;
  handleQuantityChange: (amount: number) => void;
  hasActiveUser: boolean;
  onLoginRequest: () => void;
  onNext: () => void;
  onGoToCategorySelection: (creation: Creation) => void;
  price: number;
  onLikeToggle: (creationId: string, userId: string, isLiked: boolean) => Promise<{ success: boolean }>;
  onFavoriteToggle: (creationId: string, userId: string, isFavorited: boolean) => Promise<{ success: boolean }>;
  onShare: (creationId: string) => Promise<{ success: boolean }>;
  onUpdateCreation: (creation: Creation) => void;
  onRemake: (creationId: string) => Promise<{ success: boolean }>;
}

const ViewerScreen: React.FC<ViewerScreenProps> = ({
  user,
  viewerState,
  setViewerState,
  sourceCreations,
  orderDetails,
  setOrderDetails,
  handleQuantityChange,
  hasActiveUser,
  onLoginRequest,
  onNext,
  onGoToCategorySelection,
  price,
  onLikeToggle,
  onFavoriteToggle,
  onShare,
  onUpdateCreation,
  onRemake,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const { toast } = useToast();

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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
      creation.models.forEach((model, mIndex) => {
        if (creation.userId === user?.uid || model?.isPublic !== false) {
          map.push({ creationId: creation.id, modelIndex: mIndex });
        }
      });
    });
    return map;
  }, [sourceCreations, user?.uid]);
  
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
  const currentModelImage = currentModel ? currentModel.previewUri || currentModel.uri : undefined;

  useEffect(() => {
    if (!currentCreation) return;
    if (isPatternView) return;
    const model = currentCreation.models[viewerState.modelIndex];
    if (!model) {
      setViewerState(prev => ({ ...prev, modelIndex: -1 }));
      return;
    }
    if (currentCreation.userId !== user?.uid && model.isPublic === false) {
      setViewerState(prev => ({ ...prev, modelIndex: -1 }));
    }
  }, [currentCreation, viewerState.modelIndex, isPatternView, setViewerState, user?.uid]);

  useEffect(() => {
    if (!viewerState.isOpen || !currentCreation || !user?.uid || !hasActiveUser) return;
    const modelUri = !isPatternView && currentModel ? currentModel.uri : undefined;
    logCreationInteractionAction({
      userId: user.uid,
      creationId: currentCreation.id,
      modelUri,
      action: 'view',
      weight: isPatternView ? 0.5 : 1,
      metadata: {
        viewType: isPatternView ? 'pattern' : 'model',
      },
    });
  }, [viewerState.isOpen, currentCreation, user?.uid, isPatternView, currentModel, hasActiveUser]);

  const bind = useDrag(({ last, movement: [, my], velocity: [, vy], direction: [, dy] }) => {
    if (isNavigating) return;
    if (!last) {
      setIsDragging(true);
      setDragOffset(my);
      return;
    }

    setIsDragging(false);
    setDragOffset(0);

    const threshold = 120;
    const shouldNavigate = Math.abs(my) > threshold || vy > 0.35;
    if (shouldNavigate) {
      const direction = dy < 0 ? 'next' : 'prev';
      handleNavigate(direction);
    }
  }, {
    axis: 'y',
    filterTaps: true,
  });

  const formatCount = (count: number) => {
    if (count < 1000) return count;
    if (count < 1000000) return (count / 1000).toFixed(1) + 'k';
    return (count / 1000000).toFixed(1) + 'm';
  }

  const handleLike = async () => {
    if (!currentCreation) return;
    if (!hasActiveUser || !user) {
      toast({
        variant: 'destructive',
        title: '无法执行操作',
        description: '请稍后重试，或登录账户以继续互动。',
      });
      onLoginRequest();
      return;
    }
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
    if (!currentCreation) return;
    if (!hasActiveUser || !user) {
      toast({
        variant: 'destructive',
        title: '无法执行操作',
        description: '请稍后重试，或登录账户以收藏作品。',
      });
      onLoginRequest();
      return;
    }
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

    const isTopLevel = typeof window !== 'undefined' && window.top === window.self;
    const isSecure = typeof window !== 'undefined' && window.isSecureContext;
    const shareData = {
      title: '看看我的AI新创作！',
      text: `我用POD.STYLE创作了“${currentCreation.prompt}”`,
      url: window.location.href,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && isTopLevel) {
      try {
        await navigator.share(shareData);
        onShare(currentCreation.id);
        const updatedCreation = { ...currentCreation, shareCount: currentCreation.shareCount + 1 };
        onUpdateCreation(updatedCreation);
      } catch (error: unknown) {
        if (!(error instanceof DOMException) || error.name !== 'AbortError') {
          console.warn('Native share failed:', error);
        }
      }
      return;
    }

    if (isSecure && isTopLevel && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        toast({ title: '链接已复制', description: '快去分享给朋友吧！' });
        onShare(currentCreation.id);
        const updatedCreation = { ...currentCreation, shareCount: currentCreation.shareCount + 1 };
        onUpdateCreation(updatedCreation);
      } catch (error) {
        console.warn('Clipboard copy failed:', error);
        toast({ variant: 'destructive', title: '无法复制链接', description: '请检查浏览器的剪贴板权限设置。' });
      }
      return;
    }

    toast({
      variant: 'destructive',
      title: '分享功能受限',
      description: '当前环境不支持系统分享或剪贴板复制，请手动复制浏览器地址栏。',
    });
  };

  const handleRemake = () => {
    if (!currentCreation) return;
    if (!hasActiveUser || !user) {
      toast({
        variant: 'destructive',
        title: '无法执行操作',
        description: '请稍后重试，或登录账户以复刻作品。',
      });
      onLoginRequest();
      return;
    }

    // Optimistic update
    const updatedCreation = { ...currentCreation, remakeCount: currentCreation.remakeCount + 1 };
    onUpdateCreation(updatedCreation);

    onRemake(currentCreation.id);
    onGoToCategorySelection(currentCreation);
  };


  const isLiked = hasActiveUser && user && currentCreation ? currentCreation.likedBy.includes(user.uid) : false;
  const isFavorited = hasActiveUser && user && currentCreation ? currentCreation.favoritedBy.includes(user.uid) : false;

  const socialButtonClass = "flex flex-col items-center text-white text-xs font-semibold gap-1";
  const iconButtonClass = "flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 h-12 w-12";

  const renderContent = () => {
    if (!currentCreation) {
        return null; // or a loading/error state
    }
    
    if (isPatternView) {
        return (
            <PatternPreviewScreen
                creation={currentCreation}
                isModelGenerating={false}
                onGoToModel={() => currentCreation && onGoToCategorySelection(currentCreation)}
            />
        );
    } else {
        return (
            <MockupScreen
                modelImage={currentModelImage}
                models={currentCreation.models || []}
                orderDetails={orderDetails}
                setOrderDetails={setOrderDetails}
                handleQuantityChange={handleQuantityChange}
                onNext={onNext}
                modelHistoryIndex={viewerState.modelIndex}
                onNavigateModels={onSelectModel}
                category={currentModel?.category || ''}
                price={price}
            />
        );
    }
  };


  const content = (
    <div
      {...bind()}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      style={{
        touchAction: 'none',
        transform: `translateY(${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.25s ease-out',
      }}
    >
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center p-4 bg-gradient-to-b from-black/30 to-transparent">
        <Button onClick={handleClose} variant="ghost" size="icon" className="rounded-full text-white bg-black/20 hover:bg-black/40">
          <ArrowLeft size={20} />
        </Button>
      </div>

      <div className="flex-grow relative w-full h-full">
         {renderContent()}
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
         {!isPatternView && (
            <button onClick={handleRemake} className={socialButtonClass}>
                <div className={iconButtonClass}>
                    <RefreshCw size={26} />
                </div>
                <span>{currentCreation && formatCount(currentCreation.remakeCount)}</span>
            </button>
        )}
      </div>

      {/* Comment Sheet Portal */}
      {currentCreation && (
        <CommentsSheet
            isOpen={isCommentsOpen}
            onOpenChange={setIsCommentsOpen}
            creation={currentCreation}
            user={user}
            onCommentAdded={() => {
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
