import { notificationRepository } from "@/repositories/notification.repository";

export class NotificationService {
  /**
   * Fetches chronological context records for an app user profile interface.
   */
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const items = await notificationRepository.findByUserId(userId, { limit, skip });
    const unreadCount = await notificationRepository.countUnread(userId);

    return {
      items,
      unreadCount,
    };
  }

  /**
   * Marks a specific notification element reference index item as read.
   */
  async flagNotificationAsRead(notificationId: string, userId: string) {
    const record = await notificationRepository.markAsRead(notificationId, userId);
    if (!record) throw new Error("Notification reference not found or access permission denied.");
    return record;
  }

  /**
   * Updates all unseen alert feed messages for a user profile in a single operation.
   */
  async flagAllNotificationsAsRead(userId: string) {
    await notificationRepository.markAllAsRead(userId);
    return { success: true };
  }
}

export const notificationService = new NotificationService();