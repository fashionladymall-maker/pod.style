"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { searchHashtagsAction } from '@/features/hashtags/server/actions';
import type { Hashtag } from '@/lib/types';

interface HashtagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function HashtagInput({
  value,
  onChange,
  placeholder = '添加话题标签...',
  className,
}: HashtagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Hashtag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Extract hashtags from value
  const extractedHashtags: string[] = value.match(/#[\w\u4e00-\u9fa5]+/g) ?? [];

  // Search for hashtag suggestions
  useEffect(() => {
    const searchSuggestions = async () => {
      if (inputValue.trim() && inputValue.startsWith('#')) {
        const query = inputValue.slice(1);
        const result = await searchHashtagsAction(query, 5);
        if (result.success && result.hashtags) {
          setSuggestions(result.hashtags);
          setShowSuggestions(true);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(searchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Auto-add # if user types without it
    if (newValue && !newValue.startsWith('#')) {
      setInputValue('#' + newValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addHashtag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && extractedHashtags.length > 0) {
      // Remove last hashtag if input is empty
      removeHashtag(extractedHashtags[extractedHashtags.length - 1]);
    }
  };

  const addHashtag = (hashtag: string) => {
    // Ensure hashtag starts with #
    const formattedHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    
    // Check if hashtag already exists
    if (!extractedHashtags.includes(formattedHashtag)) {
      const newValue = value ? `${value} ${formattedHashtag}` : formattedHashtag;
      onChange(newValue);
    }
    
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeHashtag = (hashtag: string) => {
    const newValue = value.replace(hashtag, '').trim();
    onChange(newValue);
  };

  const selectSuggestion = (hashtag: Hashtag) => {
    addHashtag(`#${hashtag.name}`);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Hashtag Tags */}
      {extractedHashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {extractedHashtags.map((tag, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-pink-500/20 border border-pink-500/30 rounded-full text-sm text-pink-400"
            >
              <Hash className="w-3 h-3" />
              <span>{tag.slice(1)}</span>
              <button
                onClick={() => removeHashtag(tag)}
                className="ml-1 p-0.5 hover:bg-pink-500/30 rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => inputValue && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="pl-9 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-2 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden"
          >
            {suggestions.map((hashtag) => (
              <button
                key={hashtag.id}
                onClick={() => selectSuggestion(hashtag)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-pink-500" />
                  <span className="text-white">#{hashtag.name}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {hashtag.count >= 1000
                    ? `${(hashtag.count / 1000).toFixed(1)}K`
                    : hashtag.count}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text */}
      <p className="mt-2 text-xs text-gray-500">
        输入 # 开始添加话题标签，按 Enter 确认
      </p>
    </div>
  );
}
