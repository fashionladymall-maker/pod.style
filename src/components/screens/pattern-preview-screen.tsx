
"use client";

import React from 'react';
import Image from 'next/image';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholders';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Creation } from '@/lib/types';

interface PatternPreviewScreenProps {
  creation: Creation | undefined;
  isModelGenerating: boolean;
  onGoToModel: () => void;
}

const PatternPreviewScreen = ({
  creation,
  isModelGenerating,
  onGoToModel,
}: PatternPreviewScreenProps) => {
  const generatedPattern = creation?.previewPatternUri || creation?.patternUri;

  return (
    <div 
      className="relative h-full w-full bg-secondary flex flex-col animate-fade-in"
    >
      {generatedPattern ? (
          <div className="absolute inset-0 w-full h-full animate-scale-in">
            <Image 
              src={generatedPattern} 
              alt="生成的创意图案" 
              fill 
              className="object-cover"
              placeholder="blur"
              blurDataURL={IMAGE_PLACEHOLDER}
              sizes="100vh"
              priority
            />
          </div>
      ): (
        <div className="flex-grow flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      )}

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
