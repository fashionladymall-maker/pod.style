
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { addCommentAction, getCommentsAction } from '@/app/actions';
import type { Creation, Comment, FirebaseUser } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CommentsSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    creation: Creation;
    user: FirebaseUser | null;
    onCommentAdded: (comment: Comment) => void;
}

const CommentsSheet = ({ isOpen, onOpenChange, creation, user, onCommentAdded }: CommentsSheetProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            getCommentsAction(creation.id)
                .then(setComments)
                .catch(err => {
                    console.error("Failed to fetch comments:", err);
                    toast({ variant: 'destructive', title: '无法加载评论' });
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, creation.id, toast]);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) {
            return;
        }

        if (user.isAnonymous) {
            toast({ variant: 'destructive', title: '请先登录', description: '登录后才能发表评论。' });
            return;
        }

        setIsSubmitting(true);
        try {
            const commentData = {
                userId: user.uid,
                userName: user.displayName || '匿名用户',
                userPhotoURL: user.photoURL || '',
                text: newComment.trim(),
            };
            const addedComment = await addCommentAction(creation.id, commentData);
            setComments(prev => [addedComment, ...prev]);
            onCommentAdded(addedComment);
            setNewComment('');
            // Scroll to top after adding comment
            setTimeout(() => {
                if (scrollAreaRef.current) {
                    scrollAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 100);

        } catch (error) {
            console.error("Failed to add comment:", error);
            toast({ variant: 'destructive', title: '评论失败', description: '请稍后重试。' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[75vh] flex flex-col p-0">
                <SheetHeader className="text-center p-4 border-b">
                    <SheetTitle>{creation.commentCount} 条评论</SheetTitle>
                </SheetHeader>
                <div className="flex-grow min-h-0">
                    <ScrollArea className="h-full" ref={scrollAreaRef}>
                        <div className="p-4 space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="animate-spin text-muted-foreground" />
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center text-muted-foreground py-10">
                                    还没有评论，快来抢沙发吧！
                                </div>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3 items-start">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={comment.userPhotoURL} />
                                            <AvatarFallback><UserIcon size={16} /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <p className="text-xs text-muted-foreground">{comment.userName}</p>
                                            <p className="text-sm">{comment.text}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: zhCN })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <div className="p-4 border-t bg-background">
                    <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                           <AvatarImage src={user?.photoURL || ''} />
                           <AvatarFallback><UserIcon size={16} /></AvatarFallback>
                        </Avatar>
                        <Input
                            placeholder={user?.isAnonymous ? "请登录后发表评论" : "留下你的精彩评论吧..."}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={isSubmitting || user?.isAnonymous}
                            className="bg-secondary border-none rounded-full"
                        />
                        <Button type="submit" size="icon" className="rounded-full" disabled={isSubmitting || !newComment.trim()}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default CommentsSheet;
