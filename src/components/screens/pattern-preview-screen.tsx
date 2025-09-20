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
    <div className="relative h-full w-full bg-background animate-fade-in" {...swipeHandlers}>
      {generatedPattern && (
          <div className="w-full h-full flex items-center justify-center p-8 animate-scale-in">
            <Image src={generatedPattern} alt="生成的创意图案" width={500} height={500} className="max-w-full max-h-full object-contain rounded-md shadow-2xl shadow-accent/20" />
          </div>
      )}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center bg-gradient-to-b from-black/80 to-transparent animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Button onClick={onBack} variant="ghost" size="icon" className="rounded-sm bg-black/30 hover:bg-black/60 text-primary transition-colors transform hover:scale-110"><ArrowLeft size={20} /></Button>
        <h2 className="text-xl font-bold mx-auto text-white tracking-widest" style={{ textShadow: '0 0 5px rgba(0,0,0,0.7)' }}>第一步：创意图案</h2>
        <div className="w-9 h-9"></div>
      </div>
      <HistoryNavigator currentIndex={historyIndex} total={totalHistory} onNavigate={onNavigate} />
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black/90 to-transparent text-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        {isModelGenerating ? (
          <div className="flex items-center justify-center mt-2 text-gray-300 h-11">
            <Loader2 className="animate-spin mr-2 text-primary" size={16} /> <span>正在为您生成模特试穿图...</span>
          </div>
        ) : (
          <Button onClick={onGoToModel} className="cyber-button w-full h-11">
            <Sparkles className="mr-2" size={20} />
            <span>查看模特效果</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default PatternPreviewScreen;
