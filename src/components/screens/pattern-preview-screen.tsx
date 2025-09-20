"use client";

import Image from 'next/image';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HistoryNavigator from '@/components/ui/history-navigator';
import { useSwipe } from '@/hooks/use-swipe';

interface PatternPreviewScreenProps {
  generatedPattern: string;
  onBack: () => void;
  historyIndex: number;
  totalHistory: number;
  onNavigate: (direction: number) => void;
  isModelGenerating: boolean;
  onGoToModel: () => void;
}

const PatternPreviewScreen = ({
  generatedPattern,
  onBack,
  historyIndex,
  totalHistory,
  onNavigate,
  isModelGenerating,
  onGoToModel,
}: PatternPreviewScreenProps) => {
  const swipeHandlers = useSwipe({ onSwipeLeft: () => onNavigate(1), onSwipeRight: () => onNavigate(-1) });

  return (
    <div className="relative h-full w-full bg-secondary flex flex-col animate-fade-in" {...swipeHandlers}>
       <div className="flex items-center p-4 border-b bg-background">
        <Button onClick={onBack} variant="ghost" size="icon" className="rounded-full"><ArrowLeft size={20} /></Button>
        <h2 className="text-xl font-medium mx-auto">创意图案</h2>
        <div className="w-10 h-10"></div>
      </div>
      
      {generatedPattern ? (
          <div className="flex-grow w-full flex items-center justify-center p-8 animate-scale-in">
            <Image src={generatedPattern} alt="生成的创意图案" width={500} height={500} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
          </div>
      ): (
        <div className="flex-grow flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      )}

      <HistoryNavigator currentIndex={historyIndex} total={totalHistory} onNavigate={onNavigate} />

      <div className="p-6 bg-background border-t text-center">
        <Button onClick={onGoToModel} disabled={isModelGenerating} className="w-full rounded-full h-12">
            {isModelGenerating ? <Loader2 className="animate-spin mr-2" size={20} /> : <Sparkles className="mr-2" size={20} />}
            <span>{isModelGenerating ? '正在生成模特图...' : '查看模特效果'}</span>
        </Button>
      </div>
    </div>
  );
};

export default PatternPreviewScreen;
