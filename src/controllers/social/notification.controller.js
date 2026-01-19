const { Notification, User, Follow } = require('../../models');
const { Op } = require('sequelize');

class NotificationController {
  constructor(notificationSocket) {
    this.socket = notificationSocket;
  }

  // Get user notifications
  async getUserNotifications(req, res) {

      const userId = req.currentUser.id;
      const unreadOnly = req.query.unreadOnly === 'true';

      const where = { recipient_id: userId };
      
      if (unreadOnly) {
        where.is_read = false;
      }


      const { count, rows } = await Notification.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      const unreadCount = await Notification.count({
        where: {
          recipient_id: userId,
          is_read: false
        }
      });

      res.status(200).json({
        success: true,
        data: {
          notifications: rows,
          unreadCount
        }
      });

  }

  // Get unread notification count
  async getUnreadCount(req, res) {
      const userId = req.currentUser.id;
      const count = await Notification.count({
        where: {
          recipient_id: userId,
          is_read: false
        }
      });

      res.status(200).json({
        success: true,
        data: { count }
      });
  }

  // Mark notification as read
  async markNotificationAsRead(req, res) {
    try {
      const userId = req.currentUser.id;
      const { notificationId } = req.params;

      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          recipient_id: userId
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      // Update notification
      await notification.update({
        is_read: true,
        read_at: new Date()
      });

      res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req, res) {
      const userId = req.currentUser.id;
      
      const result = await Notification.update(
        { 
          is_read: true,
          read_at: new Date()
        },
        {
          where: {
            recipient_id: userId,
            is_read: false
          }
        }
      );

      res.status(200).json({
        success: true,
        data: {
          modifiedCount: result[0],
          message: 'All notifications marked as read'
        },
        message: 'All notifications marked as read'
      });
  }

  // Delete notification
  async deleteNotification(req, res) {
      const userId = req.currentUser.id;
      const { notificationId } = req.params;

      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          recipient_id: userId
        }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.destroy();

      res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification deleted successfully'
      });
  }

  // Create follow notification (called when follow is accepted)
  async createFollowNotification(req, res) {
      const { followingId } = req.params;
      const followerId = req.currentUser.id;

      // Create notification for the person being followed
      const notification = await Notification.create({
        recipient_id: followingId,
        sender_id: followerId,
        type: 'FOLLOW_ACCEPT',
        is_read: false,
        created_at: new Date()
      });

      // Get notification with sender info
      const notificationWithSender = await Notification.findByPk(notification.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      // Send real-time notification if user is online
      if (this.socket) {
        this.socket.sendNotification(followingId, notificationWithSender);
      }

      res.status(201).json({
        success: true,
        data: notificationWithSender,
        message: 'Follow notification created'
      });
  }

  // Create follow request notification (called when someone requests to follow a private account)
  async createFollowRequestNotification(req, res) {
      const { followingId } = req.params;
      const followerId = req.currentUser.id;

      // Create notification for the person receiving the follow request
      const notification = await Notification.create({
        recipient_id: followingId,
        sender_id: followerId,
        type: 'FOLLOW_REQUEST',
        is_read: false,
        created_at: new Date()
      });

      // Get notification with sender info
      const notificationWithSender = await Notification.findByPk(notification.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      // Send real-time notification if user is online
      if (this.socket) {
        this.socket.sendNotification(followingId, notificationWithSender);
      }

      res.status(201).json({
        success: true,
        data: notificationWithSender,
        message: 'Follow request notification created'
      });
  }

  // Create like notification
  async createLikeNotification(req, res) {
       // threadId , type , authorId
      const { contentId, contentType, contentOwnerId } = req.params; // contentId is the id of the content that is liked
      const likerId = req.currentUser.id;

      if (!contentOwnerId) {
        return res.status(400).json({
          success: false,
          message: 'Content owner ID is required in URL parameters'
        });
      }

      // Don't create notification if user likes their own content
      if (contentOwnerId.toString() === likerId.toString()) {
        return res.status(200).json({
          success: true,
          message: 'No notification created for own content'
        });
      }

      // Create notification
      const notification = await Notification.create({
        recipient_id: contentOwnerId,
        sender_id: likerId,
        type: 'LIKE',
        is_read: false,
        created_at: new Date()
      });

      // Get notification with sender info
      const notificationWithSender = await Notification.findByPk(notification.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      // Send real-time notification if user is online
      if (this.socket) {
        this.socket.sendNotification(contentOwnerId, notificationWithSender);
      }

      res.status(201).json({
        success: true,
        data: notificationWithSender,
        message: 'Like notification created'
      });
  }

  // Create reply notification
  async createReplyNotification(req, res) {
    try {
      const { threadId, replyId, originalAuthorId } = req.params;
      const replierId = req.currentUser.id;

      if (!originalAuthorId) {
        return res.status(400).json({
          success: false,
          message: 'Original author ID is required in URL parameters'
        });
      }

      // Don't create notification if user replies to their own thread
      if (originalAuthorId.toString() === replierId.toString()) {
        return res.status(200).json({
          success: true,
          message: 'No notification created for own thread'
        });
      }

      // Create notification
      const notification = await Notification.create({
        recipient_id: originalAuthorId,
        sender_id: replierId,
        type: 'REPLY',
        is_read: false,
        created_at: new Date()
      });

      // Get notification with sender info
      const notificationWithSender = await Notification.findByPk(notification.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      // Send real-time notification if user is online
      if (this.socket) {
        this.socket.sendNotification(originalAuthorId, notificationWithSender);
      }

      res.status(201).json({
        success: true,
        data: notificationWithSender,
        message: 'Reply notification created'
      });
    } catch (error) {
      console.error('Error creating reply notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create reply notification',
        error: error.message
      });
    }
  }

  // Create share notification
  async createShareNotification(req, res) {

      const { contentId, originalAuthorId } = req.params;
      const sharerId = req.currentUser.id;

      if (!originalAuthorId) {
        return res.status(400).json({
          success: false,
          message: 'Original author ID is required in URL parameters'
        });
      }

      // Don't create notification if user reposts their own content
      if (originalAuthorId.toString() === sharerId.toString()) {
        return res.status(200).json({
          success: true,
          message: 'No notification created for own content'
        });
      }

      // Create notification
      const notification = await Notification.create({
        recipient_id: originalAuthorId,
        sender_id: sharerId,
        type: 'SHARE',
        is_read: false,
        created_at: new Date()
      });

      // Get notification with sender info
      const notificationWithSender = await Notification.findByPk(notification.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      // Send real-time notification if user is online
      if (this.socket) {
        this.socket.sendNotification(originalAuthorId, notificationWithSender);
      }

      res.status(201).json({
        success: true,
        data: notificationWithSender,
        message: 'share notification created'
      });
  }

  // Format notification message based on type
  formatNotificationMessage(notification) {
    const senderName = notification.sender?.full_name || notification.sender?.username || 'Someone';
    
    switch (notification.type) {
      case 'FOLLOW_ACCEPT':
        return `${senderName} started following you`;
      case 'FOLLOW_REQUEST':
        return `${senderName} requested to follow you`;
      case 'LIKE':
        return `${senderName} liked your content`;
      case 'REPLY':
        return `${senderName} replied to your thread`;
      case 'SHARE':
        return `${senderName} shared your content`;
      default:
        return `${senderName} interacted with your content`;
    }
  }

  // Static methods for backward compatibility
  static async getNotifications(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.getUserNotifications(req, res);
  }

  static async getUserNotifications(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.getUserNotifications(req, res);
  }

  static async getUnreadCount(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.getUnreadCount(req, res);
  }

  static async createNotification(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.createFollowNotification(req, res);
  }

  static async createFollowNotification(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.createFollowNotification(req, res);
  }

  static async createFollowRequestNotification(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.createFollowRequestNotification(req, res);
  }

  static async createLikeNotification(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.createLikeNotification(req, res);
  }

  static async createReplyNotification(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.createReplyNotification(req, res);
  }

  static async createShareNotification(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.createShareNotification(req, res);
  }

  static async markNotificationAsRead(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.markNotificationAsRead(req, res);
  }

  static async deleteNotification(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.deleteNotification(req, res);
  }

  static async clearAllNotifications(req, res) {
    const controller = new NotificationController(req.app.get('notificationSocket'));
    return controller.markAllAsRead(req, res);
  }
}

module.exports = NotificationController;
