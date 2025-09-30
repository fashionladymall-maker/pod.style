"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: Date;
}

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (content: string) => void;
  onLikeComment: (commentId: string) => void;
}

export function CommentDrawer({
  isOpen,
  onClose,
  comments,
  onAddComment,
  onLikeComment,
}: CommentDrawerProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* 抽屉内容 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl max-h-[80vh] flex flex-col"
          >
            {/* 顶部拖动条 */}
            <div className="flex items-center justify-center py-3">
              <div className="w-12 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* 标题栏 */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-800">
              <h3 className="text-white font-semibold text-lg">
                {comments.length} 条评论
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* 评论列表 */}
            <ScrollArea className="flex-1 px-4">
              <div className="py-4 space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>还没有评论</p>
                    <p className="text-sm mt-1">来发表第一条评论吧！</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onLike={() => onLikeComment(comment.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>

            {/* 输入框 */}
            <div className="p-4 border-t border-gray-800 bg-gray-900">
              <div className="flex items-center gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="说点什么..."
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-pink-500"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!newComment.trim()}
                  className="bg-gradient-to-r from-pink-500 to-cyan-500 hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// 评论项组件
function CommentItem({
  comment,
  onLike,
}: {
  comment: Comment;
  onLike: () => void;
}) {
  const timeAgo = getTimeAgo(comment.createdAt);

  return (
    <div className="flex gap-3">
      {/* 用户头像 */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex-shrink-0 flex items-center justify-center text-white font-semibold">
        {comment.userName.slice(0, 2).toUpperCase()}
      </div>

      {/* 评论内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-white font-medium text-sm">
            {comment.userName}
          </span>
          <span className="text-gray-500 text-xs">{timeAgo}</span>
        </div>
        <p className="text-gray-300 text-sm mt-1 break-words">
          {comment.content}
        </p>
      </div>

      {/* 点赞按钮 */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onLike}
        className="flex flex-col items-center gap-1 flex-shrink-0"
      >
        <Heart
          className={cn(
            "w-5 h-5 transition-colors",
            comment.isLiked
              ? "text-pink-500 fill-pink-500"
              : "text-gray-400"
          )}
        />
        {comment.likeCount > 0 && (
          <span className="text-gray-400 text-xs">
            {comment.likeCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}

// 时间格式化
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}
