"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Reply, MoreVertical, Trash2, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Comment } from '@/lib/types';

interface CommentItemProps {
  comment: Comment;
  userId: string | null;
  isReply?: boolean;
  onLike: (comment: Comment) => void;
  onReply: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  onReport: (comment: Comment, reason: string) => void;
}

export function CommentItem({
  comment,
  userId,
  isReply = false,
  onLike,
  onReply,
  onDelete,
  onReport,
}: CommentItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const isOwner = userId && comment.userId === userId;

  return (
    <div
      className={cn(
        'py-3',
        isReply && 'ml-12 border-l-2 border-white/10 pl-3'
      )}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-sm">
              {comment.userName}
            </span>
            <span className="text-gray-500 text-xs">
              {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>

          <p className="text-white text-sm mb-2">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(comment)}
              className="flex items-center gap-1 text-gray-400 hover:text-pink-500 transition-colors"
            >
              <Heart
                className={cn(
                  'w-4 h-4',
                  comment.isLiked && 'fill-pink-500 text-pink-500'
                )}
              />
              <span className="text-xs">{comment.likeCount || 0}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => onReply(comment)}
                className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span className="text-xs">回复</span>
              </button>
            )}

            {!isReply && comment.replyCount > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-gray-400 hover:text-white transition-colors text-xs"
              >
                {showReplies
                  ? '收起回复'
                  : `查看${comment.replyCount}条回复`}
              </button>
            )}
          </div>
        </div>

        {/* More menu */}
        {userId && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-xl border border-white/10 overflow-hidden z-20 min-w-[120px]"
                  >
                    {isOwner ? (
                      <button
                        onClick={() => {
                          onDelete(comment);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-red-500 hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onReport(comment, 'inappropriate');
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        <Flag className="w-4 h-4" />
                        举报
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Replies */}
      {!isReply && showReplies && comment.replies && (
        <div className="mt-2">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              userId={userId}
              isReply={true}
              onLike={onLike}
              onReply={onReply}
              onDelete={onDelete}
              onReport={onReport}
            />
          ))}
        </div>
      )}
    </div>
  );
}

