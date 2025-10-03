"use server";

import { getDb } from '@/lib/firebase-admin';
import type { Notification, NotificationInput } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

/**
 * Create a notification
 */
export async function createNotification(input: NotificationInput): Promise<Notification> {
  const db = getDb();
  
  // Get actor info if provided
  let actorName: string | undefined;
  let actorAvatar: string | undefined;
  
  if (input.actorId) {
    const actorDoc = await db.collection(USERS_COLLECTION).doc(input.actorId).get();
    const actorData = actorDoc.data();
    actorName = actorData?.name || 'Anonymous';
    actorAvatar = actorData?.avatar;
  }
  
  const notification: Notification = {
    id: uuidv4(),
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    actorId: input.actorId,
    actorName,
    actorAvatar,
    relatedId: input.relatedId,
    link: input.link,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
  
  await db.collection(NOTIFICATIONS_COLLECTION).doc(notification.id).set(notification);
  
  return notification;
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  type?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ notifications: Notification[]; hasMore: boolean }> {
  const db = getDb();
  
  let query = db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('userId', '==', userId);
  
  if (type && type !== 'all') {
    query = query.where('type', '==', type);
  }
  
  query = query.orderBy('createdAt', 'desc').limit(limit + 1);
  
  const snapshot = await query.get();
  const notifications = snapshot.docs.slice(0, limit).map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Notification[];
  
  return {
    notifications,
    hasMore: snapshot.docs.length > limit,
  };
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const db = getDb();
  
  await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).update({
    isRead: true,
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const db = getDb();
  
  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('userId', '==', userId)
    .where('isRead', '==', false)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { isRead: true });
  });
  
  await batch.commit();
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const db = getDb();
  
  await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).delete();
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
  const db = getDb();
  
  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('userId', '==', userId)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const db = getDb();
  
  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('userId', '==', userId)
    .where('isRead', '==', false)
    .get();
  
  return snapshot.size;
}

/**
 * Helper: Create like notification
 */
export async function createLikeNotification(
  creationOwnerId: string,
  actorId: string,
  creationId: string
): Promise<Notification | null> {
  // Don't notify if user likes their own creation
  if (creationOwnerId === actorId) {
    return null;
  }
  
  return createNotification({
    userId: creationOwnerId,
    type: 'like',
    title: '新的点赞',
    message: '赞了你的创作',
    actorId,
    relatedId: creationId,
    link: `/creation/${creationId}`,
  });
}

/**
 * Helper: Create comment notification
 */
export async function createCommentNotification(
  creationOwnerId: string,
  actorId: string,
  creationId: string,
  commentId: string
): Promise<Notification | null> {
  // Don't notify if user comments on their own creation
  if (creationOwnerId === actorId) {
    return null;
  }
  
  return createNotification({
    userId: creationOwnerId,
    type: 'comment',
    title: '新的评论',
    message: '评论了你的创作',
    actorId,
    relatedId: commentId,
    link: `/creation/${creationId}`,
  });
}

/**
 * Helper: Create reply notification
 */
export async function createReplyNotification(
  commentOwnerId: string,
  actorId: string,
  creationId: string,
  commentId: string
): Promise<Notification | null> {
  // Don't notify if user replies to their own comment
  if (commentOwnerId === actorId) {
    return null;
  }
  
  return createNotification({
    userId: commentOwnerId,
    type: 'reply',
    title: '新的回复',
    message: '回复了你的评论',
    actorId,
    relatedId: commentId,
    link: `/creation/${creationId}`,
  });
}

/**
 * Helper: Create follow notification
 */
export async function createFollowNotification(
  followedUserId: string,
  actorId: string
): Promise<Notification> {
  return createNotification({
    userId: followedUserId,
    type: 'follow',
    title: '新的粉丝',
    message: '关注了你',
    actorId,
    link: `/profile/${actorId}`,
  });
}

/**
 * Helper: Create order notification
 */
export async function createOrderNotification(
  userId: string,
  orderId: string,
  status: string
): Promise<Notification> {
  const messages: Record<string, string> = {
    pending: '订单已创建',
    processing: '订单处理中',
    shipped: '订单已发货',
    delivered: '订单已送达',
    cancelled: '订单已取消',
  };
  
  return createNotification({
    userId,
    type: 'order',
    title: '订单更新',
    message: messages[status] || '订单状态已更新',
    relatedId: orderId,
    link: `/orders/${orderId}`,
  });
}

