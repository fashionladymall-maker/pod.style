import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HistoryNavigatorProps {
  currentIndex: number;
  total: number;
  onNavigate: (direction: number) => void;
}

const HistoryNavigator = ({ currentIndex, total, onNavigate }: HistoryNavigatorProps) => {
  if (total <= 1) return null;

  return (
    <div className="absolute bottom-24 left-0 right-0 flex justify-center items-center space-x-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
      <Button
        onClick={() => onNavigate(-1)}
        disabled={currentIndex === 0}
        variant="ghost"
        size="icon"
        className="rounded-full bg-black/40 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:scale-110"
        aria-label="Previous Design"
      >
        <ArrowLeft size={24} />
      </Button>
      <span className="text-lg font-bold text-white bg-black/40 px-4 py-1 rounded-full" style={{ textShadow: '1px 1px 2px black' }}>
        {currentIndex + 1} / {total}
      </span>
      <Button
        onClick={() => onNavigate(1)}
        disabled={currentIndex >= total - 1}
        variant="ghost"
        size="icon"
        className="rounded-full bg-black/40 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:scale-110"
        aria-label="Next Design"
      >
        <ArrowRight size={24} />
      </Button>
    </div>
  );
};

export default HistoryNavigator;
