'use client';

import { Bookmark, Layers, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const formatCount = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}m`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toString();
};

type Orientation = 'vertical' | 'horizontal';

interface ActionButtonProps {
  active?: boolean;
  label: string;
  count?: number;
  onClick: () => void;
  icon: React.ReactNode;
  orientation: Orientation;
}

const ActionButton = ({ active, label, count, onClick, icon, orientation }: ActionButtonProps) => {
  const displayCount = useMemo(() => (typeof count === 'number' ? formatCount(count) : undefined), [count]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex text-xs font-medium transition-transform duration-200',
        orientation === 'vertical' ? 'flex-col items-center gap-1' : 'flex-row items-center gap-2',
        active ? 'text-pink-400' : 'text-neutral-200 hover:text-neutral-50',
      )}
    >
      <span
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 backdrop-blur',
          active ? 'border-pink-500/60 bg-pink-500/20 shadow-[0_0_25px_rgba(236,72,153,0.45)]' : 'hover:border-white/20',
        )}
      >
        {icon}
      </span>
      <span className={orientation === 'vertical' ? undefined : 'text-sm'}>{label}</span>
      {displayCount ? <span className="text-[11px] text-neutral-400">{displayCount}</span> : null}
    </button>
  );
};

export interface OmgActionBarProps {
  className?: string;
  favoriteCount: number;
  shareCount: number;
  compareCount: number;
  isFavorited: boolean;
  isCompared: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onToggleCompare: () => void;
  orientation?: Orientation;
}

export const OmgActionBar = ({
  className,
  favoriteCount,
  shareCount,
  compareCount,
  isFavorited,
  isCompared,
  onToggleFavorite,
  onShare,
  onToggleCompare,
  orientation = 'vertical',
}: OmgActionBarProps) => {
  const layoutClass = orientation === 'vertical'
    ? 'flex-col items-center gap-4'
    : 'w-full flex-row items-center justify-between gap-2';

  return (
    <div
      className={cn(
        'pointer-events-auto flex rounded-3xl border border-white/5 bg-black/30 p-4 shadow-lg backdrop-blur',
        layoutClass,
        className,
      )}
    >
      <ActionButton
        orientation={orientation}
        icon={<Bookmark className={cn('h-5 w-5', isFavorited ? 'fill-current' : '')} />}
        label="收藏"
        count={favoriteCount}
        onClick={onToggleFavorite}
        active={isFavorited}
      />
      <ActionButton
        orientation={orientation}
        icon={<Share2 className="h-5 w-5" />}
        label="分享"
        count={shareCount}
        onClick={onShare}
      />
      <ActionButton
        orientation={orientation}
        icon={<Layers className={cn('h-5 w-5', isCompared ? 'fill-current' : '')} />}
        label="对比"
        count={compareCount}
        onClick={onToggleCompare}
        active={isCompared}
      />
    </div>
  );
};

export default OmgActionBar;
