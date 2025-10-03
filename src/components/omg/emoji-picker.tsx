"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const emojiCategories = [
  {
    name: '笑脸',
    icon: '😀',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
  },
  {
    name: '手势',
    icon: '👍',
    emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚'],
  },
  {
    name: '爱心',
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  },
  {
    name: '动物',
    icon: '🐶',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆'],
  },
  {
    name: '食物',
    icon: '🍕',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙'],
  },
  {
    name: '活动',
    icon: '⚽',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
    >
      {/* 分类标签 */}
      <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-black/50">
        {emojiCategories.map((category, index) => (
          <button
            key={category.name}
            onClick={() => setActiveCategory(index)}
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-colors',
              activeCategory === index
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            )}
          >
            {category.icon}
          </button>
        ))}
      </div>

      {/* 表情网格 */}
      <ScrollArea className="h-48">
        <div className="grid grid-cols-8 gap-1 p-2">
          {emojiCategories[activeCategory].emojis.map((emoji) => (
            <motion.button
              key={emoji}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl hover:bg-white/10 transition-colors"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}

