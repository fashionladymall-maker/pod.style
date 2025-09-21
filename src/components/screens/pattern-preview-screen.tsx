
"use client";

import Image from 'next/image';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSwipe } from '@/hooks/use-swipe';
import type { Creation } from '@/lib/types';

interface PatternPreviewScreenProps {
  creation: Creation | undefined;
  onBack: () => void;
  creationHistoryIndex: number;
  totalCreations: number;
  onNavigateCreations: (direction: number) => void;
  isModelGenerating: boolean;
  onGoToModel: () => void;
}

const PatternPreviewScreen = ({
  creation,
  onBack,
  creationHistoryIndex,
  totalCreations,
  onNavigateCreations,
  isModelGenerating,
  onGoToModel,
}: PatternPreviewScreenProps) => {
  const swipeHandlers = useSwipe({ 
    onSwipeLeft: () => onNavigateCreations(1), 
    onSwipeRight: () => onNavigateCreations(-1),
    onSwipeUp: () => onNavigateCreations(1),
    onSwipeDown: () => onNavigateCreations(-1),
  });
  const generatedPattern = creation?.patternUri;
  
  return (
    <div className="relative h-full w-full bg-secondary flex flex-col animate-fade-in" {...swipeHandlers}>
      {generatedPattern ? (
          <div className="absolute inset-0 w-full h-full animate-scale-in">
            <Image src={generatedPattern} alt="生成的创意图案" layout="fill" className="object-cover" />
          </div>
      ): (
        <div className="flex-grow flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-10 flex items-center p-4 bg-gradient-to-b from-black/30 to-transparent">
        <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full text-white bg-black/20 hover:bg-black/40"><ArrowLeft size={20} /></Button>
        <h2 className="text-xl font-medium mx-auto text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>创意图案</h2>
        <div className="w-10 h-10"></div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-10 px-6 text-center">
        <Button onClick={onGoToModel} disabled={isModelGenerating || !generatedPattern} className="w-full rounded-full h-12">
            {isModelGenerating ? <Loader2 className="animate-spin mr-2" size={20} /> : <Sparkles className="mr-2" size={20} />}
            <span>{isModelGenerating ? '正在生成效果图...' : '查看POD商品效果图'}</span>
        </Button>
      </div>
    </div>
  );
};

export default PatternPreviewScreen;
