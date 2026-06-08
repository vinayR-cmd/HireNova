import { Notification, INotification, NotificationType } from "@/lib/models";
import { Types } from "mongoose";

export class NotificationRepository {
  async create(data: Partial<INotification>) {
    const notification = new Notification(data);
    return notification.save();
  }

  async findByUserId(userId: string, options?: { limit?: number; skip?: number }) {
    let query = Notification.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
    if (options?.skip) query = query.skip(options.skip);
    if (options?.limit) query = query.limit(options.limit);
    return query.lean();
  }

  async markAsRead(id: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { isRead: true },
      { returnDocument: "after" }
    ).lean();
  }

  async markAllAsRead(userId: string) {
    return Notification.updateMany({ userId: new Types.ObjectId(userId), isRead: false }, { isRead: true });
  }

  async countUnread(userId: string) {
    return Notification.countDocuments({ userId: new Types.ObjectId(userId), isRead: false });
  }
}

export const notificationRepository = new NotificationRepository();
