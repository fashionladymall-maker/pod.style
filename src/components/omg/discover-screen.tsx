"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Hash, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FirebaseImage } from '@/components/ui/firebase-image';
import type { Creation } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PullToRefresh } from './pull-to-refresh';
import { InfiniteScroll } from './infinite-scroll';

interface DiscoverScreenProps {
  creations: Creation[];
  onCreationClick: (creation: Creation) => void;
  onSearch: (query: string) => void;
  onSearchClick?: () => void;
  onRefresh?: () => Promise<void>;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoading?: boolean;
}

const trendingTags = [
  { tag: '万圣节', count: 1234 },
  { tag: '圣诞节', count: 987 },
  { tag: '可爱', count: 856 },
  { tag: '赛博朋克', count: 743 },
  { tag: '日系动漫', count: 621 },
  { tag: '梵高', count: 543 },
  { tag: '抽象艺术', count: 432 },
  { tag: '波普艺术', count: 321 },
];

const categories = [
  { name: '服装', icon: '👕', color: 'from-pink-500 to-rose-500' },
  { name: '配饰', icon: '🎒', color: 'from-purple-500 to-indigo-500' },
  { name: '家居', icon: '🏠', color: 'from-blue-500 to-cyan-500' },
  { name: '文具', icon: '📝', color: 'from-green-500 to-emerald-500' },
  { name: '数码', icon: '📱', color: 'from-yellow-500 to-amber-500' },
  { name: '艺术', icon: '🎨', color: 'from-red-500 to-orange-500' },
];

export function DiscoverScreen({
  creations,
  onCreationClick,
  onSearch,
  onSearchClick,
  onRefresh,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: DiscoverScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* 搜索栏 */}
      <div className="p-4 border-b border-white/10">
        <div
          onClick={onSearchClick}
          className="relative cursor-pointer"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <div className="pl-10 pr-4 h-12 bg-white/5 border border-white/10 rounded-lg flex items-center text-gray-500">
            搜索创意、风格、标签...
          </div>
        </div>
      </div>

      <PullToRefresh
        onRefresh={onRefresh || (async () => {})}
        className="flex-1"
        disabled={!onRefresh}
      >
        <InfiniteScroll
          onLoadMore={onLoadMore || (async () => {})}
          hasMore={hasMore}
          isLoading={isLoading}
        >
          <div className="p-4 space-y-6">
          {/* 分类 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              热门分类
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category) => (
                <motion.button
                  key={category.name}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(category.name)}
                  className={cn(
                    'aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all',
                    `bg-gradient-to-br ${category.color}`,
                    activeCategory === category.name && 'ring-2 ring-white ring-offset-2 ring-offset-black'
                  )}
                >
                  <span className="text-4xl">{category.icon}</span>
                  <span className="text-white font-semibold text-sm">{category.name}</span>
                </motion.button>
              ))}
            </div>
          </section>

          {/* 热门标签 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-500" />
              热门标签
            </h2>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((item) => (
                <motion.button
                  key={item.tag}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSearch(item.tag)}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <span className="text-white font-medium">#{item.tag}</span>
                  <span className="text-gray-400 text-sm ml-2">{item.count}</span>
                </motion.button>
              ))}
            </div>
          </section>

          {/* 热门创作 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Hash className="w-5 h-5 text-yellow-500" />
              热门创作
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {creations.slice(0, 10).map((creation) => (
                <motion.button
                  key={creation.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCreationClick(creation)}
                  className="aspect-square rounded-2xl overflow-hidden relative group"
                >
                  <FirebaseImage
                    src={creation.previewPatternUri || creation.patternUri}
                    alt={creation.summary || creation.prompt}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-sm line-clamp-2">
                        {creation.summary || creation.prompt}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-300">
                        <span>❤️ {creation.likeCount}</span>
                        <span>⭐ {creation.favoriteCount}</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          {/* 推荐创作者 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">推荐创作者</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500" />
                  <div className="flex-1">
                    <p className="text-white font-semibold">创作者 {i}</p>
                    <p className="text-gray-400 text-sm">123 作品</p>
                  </div>
                  <button className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white text-sm font-semibold">
                    关注
                  </button>
                </div>
              ))}
            </div>
          </section>
          </div>
        </InfiniteScroll>
      </PullToRefresh>
    </div>
  );
}

