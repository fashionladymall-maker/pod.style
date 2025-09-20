import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HistoryNavigatorProps {
  currentIndex: number;
  total: number;
  onNavigate: (direction: number) => void;
  variant?: 'creation' | 'model';
  summary?: string;
}

const HistoryNavigator = ({ currentIndex, total, onNavigate, variant = 'creation', summary }: HistoryNavigatorProps) => {
  if (total <= 1) return null;
  
  const label = summary ? summary : `${variant === 'creation' ? '创意' : '商品'} ${currentIndex + 1} / ${total}`;

  return (
    <div className={cn("flex justify-center items-center space-x-2 animate-fade-in-up", variant === 'model' && 'z-20')}>
      <Button
        onClick={() => onNavigate(-1)}
        disabled={currentIndex === 0}
        variant="secondary"
        size="icon"
        className="rounded-full bg-background/70 hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label={`Previous ${variant}`}
      >
        <ArrowLeft size={20} />
      </Button>
      <span className="text-sm font-medium text-foreground bg-background/70 px-4 py-2 rounded-full border shadow-sm">
        {label}
      </span>
      <Button
        onClick={() => onNavigate(1)}
        disabled={currentIndex >= total - 1}
        variant="secondary"
        size="icon"
        className="rounded-full bg-background/70 hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label={`Next ${variant}`}
      >
        <ArrowRight size={20} />
      </Button>
    </div>
  );
};

export default HistoryNavigator;
