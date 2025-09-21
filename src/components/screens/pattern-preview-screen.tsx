
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDrag } from '@use-gesture/react';
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
  const [isNavigating, setIsNavigating] = useState(false);
  const generatedPattern = creation?.patternUri;

  const bind = useDrag(
    ({ last, swipe: [, swipeY] }) => {
      if (last && !isNavigating && totalCreations > 1) {
        if (swipeY === -1) { // Swipe Up
          setIsNavigating(true);
          onNavigateCreations(1);
          setTimeout(() => setIsNavigating(false), 500); // Cooldown
        } else if (swipeY === 1) { // Swipe Down
          setIsNavigating(true);
          onNavigateCreations(-1);
          setTimeout(() => setIsNavigating(false), 500); // Cooldown
        }
      }
    },
    {
      axis: 'y',
      swipe: { distance: 40, velocity: 0.4 },
    }
  );

  return (
    <div 
      {...bind()} 
      className="relative h-full w-full bg-secondary flex flex-col animate-fade-in"
      style={{ touchAction: 'none' }}
    >
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
