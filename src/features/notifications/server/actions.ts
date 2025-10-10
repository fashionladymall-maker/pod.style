"use server";

import { z } from 'zod';
import { isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
} from './notification-service';
import type { NotificationInput } from '@/lib/types';
import {
  mockCreateNotification,
  mockDeleteAllNotifications,
  mockDeleteNotification,
  mockGetNotificationsForUser,
  mockGetUnreadNotificationCount,
  mockMarkAllNotificationsAsRead,
  mockMarkNotificationAsRead,
} from '@/server/mock/mock-store';

// Validation schemas
const notificationInputSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['like', 'comment', 'follow', 'reply', 'system', 'order']),
  title: z.string().min(1),
  message: z.string().min(1),
  actorId: z.string().optional(),
  relatedId: z.string().optional(),
  link: z.string().optional(),
});

const userIdSchema = z.string().min(1);
const notificationIdSchema = z.string().min(1);

/**
 * Create notification
 */
export async function createNotificationAction(input: NotificationInput) {
  try {
    const validated = notificationInputSchema.parse(input);

    if (!isFirebaseAdminConfigured()) {
      const notification = mockCreateNotification(validated);
      return { success: true, notification };
    }

    const notification = await createNotification(validated);
    
    return { success: true, notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create notification',
    };
  }
}

/**
 * Get notifications
 */
export async function getNotificationsAction(
  userId: string,
  type?: string,
  page: number = 1
) {
  try {
    userIdSchema.parse(userId);

    if (!isFirebaseAdminConfigured()) {
      const result = mockGetNotificationsForUser(userId, type, page);
      return { success: true, ...result };
    }

    const result = await getNotifications(userId, type, page);
    return { success: true, ...result };
  } catch (error) {
    console.error('Error getting notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get notifications',
    };
  }
}

/**
 * Mark notification as read
 */
export async function markAsReadAction(notificationId: string) {
  try {
    notificationIdSchema.parse(notificationId);

    if (!isFirebaseAdminConfigured()) {
      mockMarkNotificationAsRead(notificationId);
      return { success: true };
    }

    await markAsRead(notificationId);
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as read',
    };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsReadAction(userId: string) {
  try {
    userIdSchema.parse(userId);

    if (!isFirebaseAdminConfigured()) {
      mockMarkAllNotificationsAsRead(userId);
      return { success: true };
    }

    await markAllAsRead(userId);
    return { success: true };
  } catch (error) {
    console.error('Error marking all as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark all as read',
    };
  }
}

/**
 * Delete notification
 */
export async function deleteNotificationAction(notificationId: string) {
  try {
    notificationIdSchema.parse(notificationId);

    if (!isFirebaseAdminConfigured()) {
      mockDeleteNotification(notificationId);
      return { success: true };
    }

    await deleteNotification(notificationId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete notification',
    };
  }
}

/**
 * Delete all notifications
 */
export async function deleteAllNotificationsAction(userId: string) {
  try {
    userIdSchema.parse(userId);

    if (!isFirebaseAdminConfigured()) {
      mockDeleteAllNotifications(userId);
      return { success: true };
    }

    await deleteAllNotifications(userId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete all notifications',
    };
  }
}

/**
 * Get unread count
 */
export async function getUnreadCountAction(userId: string) {
  try {
    userIdSchema.parse(userId);

    if (!isFirebaseAdminConfigured()) {
      const count = mockGetUnreadNotificationCount(userId);
      return { success: true, count };
    }

    const count = await getUnreadCount(userId);
    return { success: true, count };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get unread count',
    };
  }
}
