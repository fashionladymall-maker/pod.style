"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { searchUsersForMentionAction } from '@/features/mentions/server/actions';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholders';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  rows?: number;
}

interface UserSuggestion {
  id: string;
  name: string;
  avatar?: string;
}

export function MentionInput({
  value,
  onChange,
  placeholder = '添加评论...',
  className,
  maxLength,
  rows = 3,
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect @ mentions and show suggestions
  useEffect(() => {
    const detectMention = () => {
      const textBeforeCursor = value.slice(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
        
        // Check if there's a space after @
        if (!textAfterAt.includes(' ')) {
          setMentionQuery(textAfterAt);
          searchUsers(textAfterAt);
          return;
        }
      }
      
      setShowSuggestions(false);
      setSuggestions([]);
    };

    detectMention();
  }, [value, cursorPosition]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    try {
      const result = await searchUsersForMentionAction(query);
      if (result.success && result.users) {
        setSuggestions(result.users);
        setShowSuggestions(result.users.length > 0);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  };

  const selectSuggestion = (user: UserSuggestion) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const newText = 
        textBeforeCursor.slice(0, lastAtIndex) + 
        `@${user.name} ` + 
        textAfterCursor;
      
      onChange(newText);
      setShowSuggestions(false);
      setSuggestions([]);
      
      // Focus back on textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastAtIndex + user.name.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        // TODO: Add keyboard navigation for suggestions
      } else if (e.key === 'Enter' && suggestions.length > 0) {
        e.preventDefault();
        selectSuggestion(suggestions[0]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className="resize-none"
      />

      {/* Mention Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden z-50"
          >
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((user) => (
                <button
                  key={user.id}
                  onClick={() => selectSuggestion(user)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {user.avatar ? (
                      <FirebaseImage
                        src={user.avatar}
                        alt={user.name}
                        fill
                        className="rounded-full object-cover"
                        placeholder="blur"
                        blurDataURL={IMAGE_PLACEHOLDER}
                      />
                    ) : (
                      <span className="text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user.name}</p>
                    <p className="text-sm text-gray-500 truncate">@{user.id.slice(0, 12)}</p>
                  </div>
                  
                  {/* @ Icon */}
                  <AtSign className="w-4 h-4 text-gray-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text */}
      {value.includes('@') && !showSuggestions && (
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <AtSign className="w-3 h-3" />
          输入 @ 提及用户
        </p>
      )}
    </div>
  );
}
