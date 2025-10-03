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
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    const validated = notificationInputSchema.parse(input);
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
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

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
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    notificationIdSchema.parse(notificationId);

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
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

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
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    notificationIdSchema.parse(notificationId);

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
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

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
    if (!isFirebaseAdminConfigured()) {
      throw new Error('Firebase Admin is not configured');
    }

    userIdSchema.parse(userId);

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

