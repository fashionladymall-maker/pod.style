"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Hash, TrendingUp, Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { getHashtagByNameAction, getCreationsByHashtagAction } from '@/features/hashtags/server/actions';
import type { Hashtag, Creation } from '@/lib/types';

interface HashtagScreenProps {
  hashtagName: string;
  creations: Creation[];
  onBack: () => void;
  onCreationClick: (creation: Creation) => void;
}

export function HashtagScreen({
  hashtagName,
  creations,
  onBack,
  onCreationClick,
}: HashtagScreenProps) {
  const [hashtag, setHashtag] = useState<Hashtag | null>(null);
  const [hashtagCreationIds, setHashtagCreationIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHashtagData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get hashtag info
      const hashtagResult = await getHashtagByNameAction(hashtagName);
      if (hashtagResult.success && hashtagResult.hashtag) {
        setHashtag(hashtagResult.hashtag);
      }

      // Get creations with this hashtag
      const creationsResult = await getCreationsByHashtagAction(hashtagName);
      if (creationsResult.success && creationsResult.creationIds) {
        setHashtagCreationIds(creationsResult.creationIds);
      }
    } catch (error) {
      console.error('Failed to load hashtag data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hashtagName]);

  useEffect(() => {
    void loadHashtagData();
  }, [loadHashtagData]);

  // Filter creations by hashtag
  const hashtagCreations = creations.filter(c => 
    hashtagCreationIds.includes(c.id)
  );

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-800">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Hash className="w-6 h-6 text-pink-500" />
            {hashtagName}
          </h1>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Hashtag Info */}
            {hashtag && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl p-6 border border-pink-500/30"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    <Hash className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">#{hashtag.name}</h2>
                    <p className="text-gray-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {formatCount(hashtag.count)} 次使用
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Creations Grid */}
            {hashtagCreations.length > 0 ? (
              <section>
                <h3 className="text-lg font-semibold mb-3">相关创作</h3>
                <div className="grid grid-cols-3 gap-2">
                  {hashtagCreations.map((creation, index) => (
                    <motion.div
                      key={creation.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => onCreationClick(creation)}
                      className="aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                    >
                      <FirebaseImage
                        src={creation.previewPatternUri || creation.patternUri}
                        alt={creation.prompt}
                        fill
                        className="object-cover"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Stats */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center gap-2 text-white text-sm">
                          <Play className="w-4 h-4" />
                          <span>{formatCount(creation.likeCount || 0)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="text-center py-12">
                <Hash className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">暂无相关创作</p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
