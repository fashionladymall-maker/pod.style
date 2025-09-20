import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HistoryNavigatorProps {
  currentIndex: number;
  total: number;
  onNavigate: (direction: number) => void;
  variant?: 'creation' | 'model';
}

const HistoryNavigator = ({ currentIndex, total, onNavigate, variant = 'creation' }: HistoryNavigatorProps) => {
  if (total <= 1) return null;

  const positionClass = variant === 'creation' ? 'bottom-6' : 'bottom-40';

  return (
    <div className={cn("absolute left-1/2 -translate-x-1/2 flex justify-center items-center space-x-2 animate-fade-in-up", positionClass)} style={{ animationDelay: '500ms' }}>
      <Button
        onClick={() => onNavigate(-1)}
        disabled={currentIndex === 0}
        variant="secondary"
        size="icon"
        className="rounded-full bg-background/70 hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous Design"
      >
        <ArrowLeft size={20} />
      </Button>
      <span className="text-sm font-medium text-foreground bg-background/70 px-4 py-2 rounded-full border">
        {currentIndex + 1} / {total}
      </span>
      <Button
        onClick={() => onNavigate(1)}
        disabled={currentIndex >= total - 1}
        variant="secondary"
        size="icon"
        className="rounded-full bg-background/70 hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next Design"
      >
        <ArrowRight size={20} />
      </Button>
    </div>
  );
};

export default HistoryNavigator;
