"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Smile } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Comment } from '@/lib/types';
import { EmojiPicker } from './emoji-picker';
import { CommentItem } from './comment-item';
import { MentionInput } from './mention-input';
import {
  addCommentAction,
  getCommentsAction,
  toggleCommentLikeAction,
  deleteCommentAction,
  reportCommentAction,
} from '@/features/comments/server/actions';
import { createMentionsFromTextAction } from '@/features/mentions/server/actions';
import { useToast } from '@/hooks/use-toast';

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  creationId: string;
  userId: string | null;
  isAuthenticated: boolean;
  onLogin: () => void;
}

export function CommentDrawer({
  isOpen,
  onClose,
  creationId,
  userId,
  isAuthenticated,
  onLogin,
}: CommentDrawerProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCommentsAction(creationId, sortBy, 1);
      setComments(result.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [creationId, sortBy]);

  useEffect(() => {
    if (isOpen && creationId) {
      void loadComments();
    }
  }, [creationId, isOpen, loadComments]);

  const handleSubmit = async () => {
    if (!isAuthenticated || !userId) {
      onLogin();
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await addCommentAction({
        creationId,
        userId,
        content: newComment.trim(),
        parentId: replyingTo?.id,
      });

      // Create mentions if any
      if (newComment.includes('@')) {
        try {
          await createMentionsFromTextAction(
            newComment,
            userId,
            creationId,
            comment.id
          );
        } catch (error) {
          console.error('Failed to create mentions:', error);
        }
      }

      if (replyingTo) {
        setComments(prev =>
          prev.map(c =>
            c.id === replyingTo.id
              ? {
                  ...c,
                  replyCount: c.replyCount + 1,
                  replies: [...(c.replies || []), comment],
                }
              : c
          )
        );
      } else {
        setComments(prev => [comment, ...prev]);
      }

      setNewComment('');
      setReplyingTo(null);
      toast({ title: '评论成功' });
    } catch (error) {
      console.error('Failed to submit comment:', error);
      const message = error instanceof Error ? error.message : '请稍后重试';
      toast({
        title: '评论失败',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (comment: Comment) => {
    if (!isAuthenticated || !userId) {
      onLogin();
      return;
    }

    const isLiked = comment.isLiked || false;
    const newIsLiked = !isLiked;

    const updateComment = (c: Comment): Comment => {
      if (c.id === comment.id) {
        return {
          ...c,
          isLiked: newIsLiked,
          likeCount: newIsLiked ? c.likeCount + 1 : c.likeCount - 1,
        };
      }
      if (c.replies) {
        return { ...c, replies: c.replies.map(updateComment) };
      }
      return c;
    };

    setComments(prev => prev.map(updateComment));

    try {
      await toggleCommentLikeAction(comment.id, userId, newIsLiked);
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
      setComments(prev => prev.map(updateComment));
      toast({
        title: '操作失败',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!userId || comment.userId !== userId) return;

    try {
      await deleteCommentAction(comment.id, userId);
      
      setComments(prev =>
        prev.map(c =>
          c.id === comment.id
            ? { ...c, isDeleted: true, content: '[已删除]' }
            : c.replies
            ? { ...c, replies: c.replies.filter(r => r.id !== comment.id) }
            : c
        )
      );

      toast({ title: '删除成功' });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      const message = error instanceof Error ? error.message : '请稍后重试';
      toast({
        title: '删除失败',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleReportComment = async (comment: Comment, reason: string) => {
    if (!userId) return;

    try {
      await reportCommentAction(comment.id, userId, reason);
      toast({
        title: '举报成功',
        description: '我们会尽快处理',
      });
    } catch (error) {
      console.error('Failed to report comment:', error);
      toast({ title: '举报失败', variant: 'destructive' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-white">
                  {comments.length} 条评论
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortBy('latest')}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm transition-colors',
                      sortBy === 'latest'
                        ? 'bg-white/20 text-white'
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    最新
                  </button>
                  <button
                    onClick={() => setSortBy('popular')}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm transition-colors',
                      sortBy === 'popular'
                        ? 'bg-white/20 text-white'
                        : 'text-gray-400 hover:text-white'
                    )}
                  >
                    最热
                  </button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-4">
              {isLoading && comments.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-400">加载中...</div>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-gray-400 mb-2">还没有评论</div>
                  <div className="text-gray-500 text-sm">快来发表第一条评论吧</div>
                </div>
              ) : (
                <>
                  {comments.map(comment => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      userId={userId}
                      onLike={handleLikeComment}
                      onReply={() => setReplyingTo(comment)}
                      onDelete={handleDeleteComment}
                      onReport={handleReportComment}
                    />
                  ))}
                </>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-white/10 bg-black/50">
              {replyingTo && (
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                  <span>回复 @{replyingTo.userName}</span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-start gap-2 relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-gray-400 hover:text-white transition-colors mt-2"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <MentionInput
                  value={newComment}
                  onChange={setNewComment}
                  placeholder={
                    replyingTo
                      ? `回复 @${replyingTo.userName}...`
                      : '说点什么...'
                  }
                  className="flex-1"
                  maxLength={500}
                  rows={2}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 mt-2"
                >
                  <Send className="w-4 h-4" />
                </Button>

                <AnimatePresence>
                  {showEmojiPicker && (
                    <EmojiPicker
                      onSelect={(emoji) => {
                        setNewComment(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
