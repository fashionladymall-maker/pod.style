'use client';

import Image from 'next/image';
import { useCallback, useContext, useEffect, useState, useTransition } from 'react';
import { AuthContext } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  getNotificationsAction,
  markAllAsReadAction,
  markAsReadAction,
} from '@/features/notifications/server/actions';
import type { Notification } from '@/lib/types';

const buildAvatar = (notification: Notification) => {
  if (notification.actorAvatar) {
    return notification.actorAvatar;
  }
  const seed = notification.actorName ?? notification.type;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return '昨天';
  }
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};

export default function MessagesPage() {
  const auth = useContext(AuthContext);
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const userId = auth?.user?.uid ?? null;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const result = await getNotificationsAction(userId);
        if (!cancelled) {
          if (result.success && 'notifications' in result) {
            setNotifications(result.notifications);
          } else {
            const description = result.success ? '未能解析消息列表。' : result.error;
            toast({
              variant: 'destructive',
              title: '无法获取消息',
              description,
            });
          }
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : '消息加载失败，请稍后再试。';
          toast({ variant: 'destructive', title: '无法获取消息', description: message });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, toast]);

  const handleMarkAsRead = useCallback(
    (notification: Notification) => {
      if (!userId || notification.isRead) {
        return;
      }
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)),
      );

      startTransition(async () => {
        try {
          const result = await markAsReadAction(notification.id);
          if (!result.success) {
            throw new Error(result.error);
          }
        } catch (error) {
          setNotifications((prev) =>
            prev.map((item) => (item.id === notification.id ? { ...item, isRead: false } : item)),
          );
          const message = error instanceof Error ? error.message : '标记为已读失败。';
          toast({ variant: 'destructive', title: '操作失败', description: message });
        }
      });
    },
    [startTransition, toast, userId],
  );

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const handleMarkAll = () => {
    if (!userId || unreadCount === 0) {
      return;
    }

    const previous = notifications;
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));

    startTransition(async () => {
      try {
        const result = await markAllAsReadAction(userId);
        if (!result.success) {
          throw new Error(result.error);
        }
      } catch (error) {
        setNotifications(previous);
        const message = error instanceof Error ? error.message : '批量标记失败。';
        toast({ variant: 'destructive', title: '操作失败', description: message });
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>正在加载消息...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">请登录后查看消息</h1>
          <p className="text-gray-400">登录账户即可同步通知与客服消息。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* 头部 */}
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">消息</h1>
            <p className="text-sm text-gray-400 mt-1">查看系统通知、订单进度与互动提醒。</p>
          </div>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={isPending || unreadCount === 0}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              unreadCount === 0
                ? 'bg-zinc-700/60 text-gray-400 cursor-not-allowed'
                : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
          >
            标记全部已读
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="max-w-4xl mx-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            暂无消息
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {notifications.map((notification) => {
              const avatar = buildAvatar(notification);
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleMarkAsRead(notification)}
                  className={`w-full text-left px-6 py-4 transition-colors ${
                    notification.isRead ? 'hover:bg-zinc-800/40' : 'bg-zinc-800/30 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Image
                        src={avatar}
                        alt={notification.actorName ?? '系统通知'}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full"
                      />
                      {!notification.isRead && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium ${notification.isRead ? 'text-gray-200' : 'text-white'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-sm text-gray-400">
                          {formatTimestamp(notification.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${notification.isRead ? 'text-gray-400' : 'text-gray-200'}`}>
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
