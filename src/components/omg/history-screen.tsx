"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { PullToRefresh } from './pull-to-refresh';
import { 
  getViewHistoryAction, 
  clearViewHistoryAction,
  deleteViewHistoryItemAction 
} from '@/features/history/server/actions';
import { useToast } from '@/hooks/use-toast';
import type { Creation, ViewHistory } from '@/lib/types';

interface HistoryScreenProps {
  userId: string | null;
  creations: Creation[];
  onBack: () => void;
  onCreationClick: (creation: Creation) => void;
}

export function HistoryScreen({
  userId,
  creations,
  onBack,
  onCreationClick,
}: HistoryScreenProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<ViewHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const result = await getViewHistoryAction(userId);
      if (result.success && result.history) {
        setHistory(result.history);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      toast({
        title: '加载失败',
        description: '无法加载浏览历史',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, userId]);

  useEffect(() => {
    if (userId) {
      void loadHistory();
    } else {
      setHistory([]);
    }
  }, [loadHistory, userId]);

  const handleClearHistory = async () => {
    if (!userId) return;
    
    try {
      const result = await clearViewHistoryAction(userId);
      if (result.success) {
        setHistory([]);
        setShowClearConfirm(false);
        toast({
          title: '已清除',
          description: '浏览历史已清空',
        });
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast({
        title: '清除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (historyId: string) => {
    try {
      const result = await deleteViewHistoryItemAction(historyId);
      if (result.success) {
        setHistory(prev => prev.filter(h => h.id !== historyId));
        toast({
          title: '已删除',
          description: '记录已删除',
        });
      }
    } catch (error) {
      console.error('Failed to delete history item:', error);
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    if (seconds < 60) return `${Math.floor(seconds)}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get creations from history
  const historyCreations = history
    .map(h => {
      const creation = creations.find(c => c.id === h.creationId);
      return creation ? { ...h, creation } : null;
    })
    .filter(Boolean) as Array<ViewHistory & { creation: Creation }>;

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">浏览历史</h1>
            <p className="text-sm text-gray-400">{history.length} 条记录</p>
          </div>
        </div>
        
        {history.length > 0 && (
          <Button
            onClick={() => setShowClearConfirm(true)}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            清空
          </Button>
        )}
      </div>

      {/* Content */}
      <PullToRefresh onRefresh={loadHistory} className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historyCreations.length > 0 ? (
          <div className="p-4 space-y-4">
            {historyCreations.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 group"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => onCreationClick(item.creation)}
                  className="relative w-32 h-48 bg-gray-900 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                >
                  <FirebaseImage
                    src={item.creation.previewPatternUri || item.creation.patternUri}
                    alt={item.creation.prompt}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                  
                  {/* Duration */}
                  {item.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs">
                      {formatDuration(item.duration)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium line-clamp-2 mb-1">
                    {item.creation.prompt || '无标题'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(item.viewedAt)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{item.creation.likeCount || 0} 赞</span>
                    <span>{item.creation.commentCount || 0} 评论</span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-800 rounded-full transition-all self-start"
                >
                  <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-500" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Clock className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-500 text-lg">暂无浏览历史</p>
            <p className="text-gray-600 text-sm mt-2">观看的创作会显示在这里</p>
          </div>
        )}
      </PullToRefresh>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-xl font-bold mb-2">清空浏览历史？</h3>
              <p className="text-gray-400 mb-6">
                此操作将删除所有浏览记录，且无法恢复
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowClearConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={handleClearHistory}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  清空
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
