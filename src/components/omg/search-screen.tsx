"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Clock, User, Image } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholders';
import { searchUsersAction } from '@/features/users/server/actions';
import type { Creation } from '@/lib/types';

interface SearchUserResult {
  id: string;
  name: string;
  avatar?: string | null;
}

interface SearchScreenProps {
  creations: Creation[];
  onCreationClick: (creation: Creation) => void;
  onUserClick: (userId: string) => void;
  onClose: () => void;
}

type SearchTab = 'all' | 'users' | 'creations';

export function SearchScreen({
  creations,
  onCreationClick,
  onUserClick,
  onClose,
}: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [userResults, setUserResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Search when query changes
  const performSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      // Search users
      const result = await searchUsersAction(query);
      if (result.success && result.users) {
        setUserResults(result.users as SearchUserResult[]);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  useEffect(() => {
    if (query.trim()) {
      void performSearch();
    } else {
      setUserResults([]);
    }
  }, [performSearch, query]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    
    // Add to history
    if (searchQuery.trim() && !searchHistory.includes(searchQuery)) {
      const newHistory = [searchQuery, ...searchHistory].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const removeHistoryItem = (item: string) => {
    const newHistory = searchHistory.filter(h => h !== item);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Filter creations by query
  const creationResults = query.trim()
    ? creations.filter(c =>
        c.prompt?.toLowerCase().includes(query.toLowerCase()) ||
        c.userId.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const tabs: { type: SearchTab; label: string }[] = [
    { type: 'all', label: '全部' },
    { type: 'users', label: '用户' },
    { type: 'creations', label: '创作' },
  ];

  const trendingSearches = [
    '万圣节',
    '圣诞节',
    '可爱',
    '简约',
    '复古',
    '未来',
  ];

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(query);
              }
            }}
            placeholder="搜索用户、创作..."
            className="pl-10 pr-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          取消
        </button>
      </div>

      {/* Tabs */}
      {query && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === tab.type
                  ? 'bg-white text-black'
                  : 'bg-gray-900 text-gray-400 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {!query ? (
            <>
              {/* Search History */}
              {searchHistory.length > 0 && (
                <section className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-400">搜索历史</h2>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-gray-500 hover:text-white transition-colors"
                    >
                      清除
                    </button>
                  </div>
                  <div className="space-y-2">
                    {searchHistory.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer group"
                        onClick={() => handleSearch(item)}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{item}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeHistoryItem(item);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded-full transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Trending Searches */}
              <section>
                <h2 className="text-sm font-semibold text-gray-400 mb-3">热门搜索</h2>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((item, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSearch(item)}
                      className="px-4 py-2 bg-gray-900 rounded-full text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4 text-pink-500" />
                      {item}
                    </motion.button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Loading */}
              {isSearching && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Results */}
              {!isSearching && (
                <>
                  {/* User Results */}
                  {(activeTab === 'all' || activeTab === 'users') && userResults.length > 0 && (
                    <section className="mb-6">
                      <h2 className="text-sm font-semibold text-gray-400 mb-3">用户</h2>
                      <div className="space-y-2">
                        {userResults.map((user) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => onUserClick(user.id)}
                            className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                          >
                            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                              {user.avatar ? (
                                <FirebaseImage
                                  src={user.avatar}
                                  alt={user.name}
                                  fill
                                  className="object-cover"
                                  placeholder="blur"
                                  blurDataURL={IMAGE_PLACEHOLDER}
                                />
                              ) : (
                                user.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{user.name}</p>
                              <p className="text-sm text-gray-500 truncate">@{user.id.slice(0, 12)}</p>
                            </div>
                            <User className="w-5 h-5 text-gray-500" />
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Creation Results */}
                  {(activeTab === 'all' || activeTab === 'creations') && creationResults.length > 0 && (
                    <section>
                      <h2 className="text-sm font-semibold text-gray-400 mb-3">创作</h2>
                      <div className="grid grid-cols-3 gap-2">
                        {creationResults.map((creation) => (
                          <motion.div
                            key={creation.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => onCreationClick(creation)}
                            className="aspect-square bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            {(creation.previewPatternUri ?? creation.patternUri) ? (
                              <div className="relative h-full w-full">
                                <FirebaseImage
                                  src={creation.previewPatternUri ?? creation.patternUri}
                                  alt={creation.prompt}
                                  fill
                                  className="object-cover"
                                  placeholder="blur"
                                  blurDataURL={IMAGE_PLACEHOLDER}
                                />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="w-8 h-8 text-gray-600" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* No Results */}
                  {userResults.length === 0 && creationResults.length === 0 && (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500">未找到相关结果</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
