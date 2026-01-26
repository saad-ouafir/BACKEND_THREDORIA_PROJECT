const { Notification, User } = require("../../models");
const { Op } = require("sequelize");

class NotificationController {
  // Get user notifications
  static async getUserNotifications(req, res) {
    const userId = req.currentUser.id;
    // Find and Count all notification with status `unread`
    const { count, rows } = await Notification.findAndCountAll({
      where: {
        [Op.and]: {
          recipient_id: userId,
        },
      },
      order: [["created_at", "DESC"]],
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "username", "full_name", "profile_picture_url"],
        },
      ],
    });

    res.status(200).json({
      message: "Notification fetched successfully",
      notifications: rows,
      unreadCount: count,
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

  // Delete notification
  static async deleteNotifications(req, res) {
    const userId = req.currentUser.id;
    const { notificationId } = req.params;

    const notification = await Notification.destroyAll({
      where: {
        id: notificationId,
        type: { [Op.not]: "FOLLOW_REQUEST" },
        recipient_id: userId,
      },
    });

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  }

  // Create Notification (triggered by the eventsHandler)
  static async createNotication(notification_type, sender_id, recipient_id, target_id) {
    await Notification.create({
      type: notification_type,
      sender_id: sender_id,
      recipient_id: recipient_id,
      target_id: target_id,
      created_at: Date.now(),
    });
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
