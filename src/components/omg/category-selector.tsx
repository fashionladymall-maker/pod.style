"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const podCategories = [
  { name: "T恤 (T-shirts)" },
  { name: "连帽衫 (Hoodies)" },
  { name: "运动卫衣 (Sweatshirts)" },
  { name: "帽子 (Hats)" },
  { name: "袜子 (Socks)" },
  { name: "帆布包 (Tote Bags)" },
  { name: "背包 (Backpacks)" },
  { name: "马克杯 (Mugs)" },
  { name: "水壶/保温杯 (Water Bottles/Tumblers)" },
  { name: "抱枕 (Pillows/Cushions)" },
  { name: "毯子 (Blankets)" },
  { name: "墙面艺术 (Wall Art)" },
  { name: "毛巾 (Towels)" },
  { name: "花园旗 (Garden Flags)" },
  { name: "手机壳 (Phone Cases)" },
  { name: "笔记本电脑保护套 (Laptop Sleeves)" },
  { name: "贴纸 (Stickers)" },
  { name: "笔记本和日志本 (Notebooks & Journals)" },
  { name: "珠宝 (Jewelry)" },
  { name: "拼图 (Puzzles)" },
];

const colors = [
  'bg-rose-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-fuchsia-500',
  'bg-amber-500',
  'bg-cyan-500',
];

interface CategorySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
  isGenerating: boolean;
}

export function CategorySelector({
  isOpen,
  onClose,
  onSelect,
  isGenerating,
}: CategorySelectorProps) {
  if (!isOpen) return null;

  const parseCategory = (name: string) => {
    const match = name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return { chinese: match[1], english: match[2] };
    }
    return { chinese: name, english: '' };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-gradient-to-b from-gray-900 to-black rounded-t-3xl max-h-[80vh] flex flex-col"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">选择商品品类</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* 品类网格 */}
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-3 pb-6">
            {podCategories.map((category, index) => {
              const { chinese, english } = parseCategory(category.name);
              return (
                <motion.button
                  key={category.name}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect(category.name)}
                  disabled={isGenerating}
                  className={cn(
                    'h-24 rounded-xl flex flex-col justify-center items-center text-center p-3 shadow-lg transition-all duration-200',
                    colors[index % colors.length],
                    'hover:shadow-xl hover:scale-105',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  )}
                >
                  <span className="font-bold text-white text-base leading-tight">
                    {chinese}
                  </span>
                  {english && (
                    <span className="text-white/90 text-xs mt-1">{english}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </ScrollArea>

        {/* 提示 */}
        <div className="p-4 border-t border-white/10">
          <p className="text-center text-sm text-gray-400">
            💡 选择品类后，AI将为你生成商品效果图
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

