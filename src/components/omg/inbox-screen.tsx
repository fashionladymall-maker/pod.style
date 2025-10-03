"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Heart,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Package,
  CheckCircle,
  Clock,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Order, Notification, NotificationType } from '@/lib/types';
import {
  getNotificationsAction,
  markAsReadAction,
  deleteNotificationAction
} from '@/features/notifications/server/actions';
import { FirebaseImage } from '@/components/ui/firebase-image';
import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholders';

interface InboxScreenProps {
  userId: string | null;
  orders: Order[];
  onOrderClick: (order: Order) => void;
}

type FilterType = 'all' | 'like' | 'comment' | 'follow' | 'order' | 'system';

export function InboxScreen({ userId, orders, onOrderClick }: InboxScreenProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const result = await getNotificationsAction(
        userId,
        activeFilter === 'all' ? undefined : activeFilter
      );

      if (result.success && 'notifications' in result) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, userId]);

  useEffect(() => {
    if (userId) {
      void loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [activeFilter, loadNotifications, userId]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsReadAction(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
    }

    // Navigate if has link
    if (notification.link) {
      // TODO: Navigate to link
      console.log('Navigate to:', notification.link);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotificationAction(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const filters: { type: FilterType; label: string; icon: React.ReactNode }[] = [
    { type: 'all', label: '全部', icon: <Bell className="w-4 h-4" /> },
    { type: 'like', label: '点赞', icon: <Heart className="w-4 h-4" /> },
    { type: 'comment', label: '评论', icon: <MessageCircle className="w-4 h-4" /> },
    { type: 'follow', label: '关注', icon: <UserPlus className="w-4 h-4" /> },
    { type: 'order', label: '订单', icon: <ShoppingBag className="w-4 h-4" /> },
    { type: 'system', label: '系统', icon: <Sparkles className="w-4 h-4" /> },
  ];

  // Mirror server-side filtering to keep UI fallbacks consistent.
  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter((notification) =>
        activeFilter === 'comment'
          ? notification.type === 'comment' || notification.type === 'reply'
          : notification.type === activeFilter
      );

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'order':
        return <Package className="w-5 h-5 text-green-500" />;
      case 'system':
        return <Sparkles className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
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

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Package className="w-5 h-5 text-blue-500" />;
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '处理中';
      case 'shipped':
        return '已发货';
      case 'pending':
        return '待处理';
      default:
        return status;
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white mb-4">消息中心</h1>

        {/* 过滤器 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <motion.button
              key={filter.type}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(filter.type)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all',
                activeFilter === filter.type
                  ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
              )}
            >
              {filter.icon}
              <span className="text-sm font-medium">{filter.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* 加载状态 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 mb-3">通知</h2>
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-4 rounded-xl border transition-all cursor-pointer relative group',
                      notification.isRead
                        ? 'bg-white/5 border-white/10'
                        : 'bg-gradient-to-r from-pink-500/10 to-cyan-500/10 border-pink-500/20'
                    )}
                  >
                      <div className="flex items-start gap-3">
                        {/* Avatar or Icon */}
                        <div className="mt-0.5">
                        {notification.actorAvatar ? (
                          <div className="relative w-10 h-10 overflow-hidden rounded-full">
                            <FirebaseImage
                              src={notification.actorAvatar}
                              alt={notification.actorName ?? '通知头像'}
                              fill
                              className="object-cover"
                              placeholder="blur"
                              blurDataURL={IMAGE_PLACEHOLDER}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-white font-semibold text-sm">
                              {notification.actorName && (
                                <span className="text-pink-500">{notification.actorName} </span>
                              )}
                              {notification.message}
                            </h3>
                          </div>
                          <span className="text-gray-500 text-xs whitespace-nowrap">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteNotification(notification.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white"
                          aria-label="删除通知"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-pink-500 rounded-full" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">
                暂无{activeFilter !== 'all' && filters.find(f => f.type === activeFilter)?.label}通知
              </p>
            </div>
          )}

          {/* 订单列表 */}
          {(activeFilter === 'all' || activeFilter === 'order') && orders.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-gray-400 mb-3">最近订单</h2>
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <motion.button
                    key={order.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onOrderClick(order)}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      {getOrderStatusIcon(order.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-white font-semibold text-sm">
                            订单 #{order.id.slice(0, 8)}
                          </h3>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              order.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : order.status === 'processing'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-blue-500/20 text-blue-400'
                            )}
                          >
                            {getOrderStatusText(order.status)}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                          {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {/* 空状态 */}
          {filteredNotifications.length === 0 && orders.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">暂无消息</h3>
              <p className="text-gray-500 text-sm">
                你的通知和订单更新会显示在这里
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
