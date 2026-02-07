const { Notification, User } = require("../../models");
const { Op } = require("sequelize");
const { applyPagination, buildPaginationMeta } = require("../../utils/pagination");

class NotificationController {
  // Get user notifications with pagination
  static async getUserNotifications(req, res) {
    const userId = req.currentUser.id;
    const { limit, offset, paginationParams } = applyPagination(req.query);

    // Find and Count all notifications for this user
    const { count, rows } = await Notification.findAndCountAll({
      where: {
        recipient_id: userId,
      },
      order: [["created_at", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "username", "full_name", "profile_picture_url"],
        },
      ],
    });

    // Count only unread notifications
    const unreadCount = await Notification.count({
      where: {
        recipient_id: userId,
        is_read: false,
      },
    });

    res.status(200).json({
      message: "Notifications fetched successfully",
      notifications: rows,
      unreadCount,
      pagination: buildPaginationMeta(count, paginationParams.page, paginationParams.limit),
    });
  }

  // Mark notification as read
  static async markNotificationAsRead(req, res) {
    const userId = req.currentUser.id;
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        recipient_id: userId,
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "username", "full_name", "profile_picture_url"],
        },
      ],
    });

    // Update notification
    notification
      ? await notification.update({
          is_read: true,
          read_at: new Date(),
        })
      : null;

    res.status(200).json({
      data: notification,
      message: "Notification marked as read",
    });
  }

  // Mark all notifications as read
  static async markAllNotificationsAsRead(req, res) {
    const userId = req.currentUser.id;
    // Update Status of All notifications
    const result = await Notification.update(
      {
        is_read: true,
        read_at: new Date(),
      },
      {
        where: {
          recipient_id: userId,
          is_read: false,
        },
      },
    );

    res.status(200).json({
      message: "All notifications are marked as read",
    });
  }

  // Delete notification (clears notification only, does not affect follow requests)
  static async deleteNotifications(req, res) {
    const userId = req.currentUser.id;
    const { notificationId } = req.params;

    await Notification.destroy({
      where: {
        id: notificationId,
        recipient_id: userId,
      },
    });

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  }

  // Delete all notifications for the user (clears notifications only, does not affect follow requests)
  static async deleteAllNotifications(req, res) {
    const userId = req.currentUser.id;

    const deletedCount = await Notification.destroy({
      where: {
        recipient_id: userId,
      },
    });

    res.status(200).json({
      message: "All notifications deleted successfully",
      deletedCount,
    });
  }

  // Create Notification (triggered by the eventsHandler)
  static async createNotication(notification_type, sender_id, recipient_id, target_id) {
    const notification = await Notification.create({
      type: notification_type,
      sender_id: sender_id,
      recipient_id: recipient_id,
      target_id: target_id,
      created_at: Date.now(),
    });

    // Fetch the notification with sender info for WebSocket
    const notificationWithSender = await Notification.findOne({
      where: { id: notification.id },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "username", "full_name", "profile_picture_url"],
        },
      ],
    });

    return notificationWithSender;
  }

  // Cancel Notification
  static async cancelNotification(notification_type, sender_id, recipient_id, target_id) {
    await Notification.destroy({
      where: {
        type: notification_type,
        sender_id: sender_id,
        recipient_id: recipient_id,
        target_id: target_id,
      },
    });
  }
}

module.exports = NotificationController;
