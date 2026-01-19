const { Notification, User } = require('../models');
const EventEmitter = require('events');

class NotificationEmitter extends EventEmitter {}

// Global notification emitter instance
const notificationEmitter = new NotificationEmitter();

class NotificationMiddleware {
  static async createNotification(req, res, next) {
    // This middleware creates notifications and emits WebSocket events
    // Call this after database operations that should trigger notifications
    const { type, recipientId, senderId, targetId } = req.body;
    const io = req.app.get('io');
    
    if (!type || !recipientId || !senderId) {
      return next();
    }
      // Create notification in database
      const notification = await Notification.create({
        recipient_id: recipientId,
        sender_id: senderId,
        type: type,
        target_id: targetId || senderId,
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

      // Emit WebSocket event to recipient's room
      if (io) {
        io.to(`user_${recipientId}`).emit('notification', {
          type: type,
          senderId: senderId,
          notification: notificationWithSender
        });
      }

      req.notification = notificationWithSender;
      next();
  }

  // Event-based notification creation
  static setupEventListeners() {
    // Follow request event
    notificationEmitter.on('follow_request', async (data) => {
      await this.createFollowNotification(data);
    });

    // Follow accept event
    notificationEmitter.on('follow_accept', async (data) => {
      await this.createFollowNotification(data);
    });

    // Like event
    notificationEmitter.on('like', async (data) => {
      await this.createLikeNotification(data);
    });

    // Reply event
    notificationEmitter.on('reply', async (data) => {
      await this.createReplyNotification(data);
    });

    // Share event
    notificationEmitter.on('share', async (data) => {
      await this.createShareNotification(data);
    });
  }

  static async createFollowNotification(data) {
    const { recipientId, senderId, type, io } = data;
    
    try {
      const notification = await Notification.create({
        recipient_id: recipientId,
        sender_id: senderId,
        type: type,
        target_id: senderId,
        is_read: false,
        created_at: new Date()
      });

      const notificationWithSender = await Notification.findByPk(notification.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      // Emit WebSocket event
      if (io) {
        io.to(`user_${recipientId}`).emit('notification', {
          type: type,
          senderId: senderId,
          notification: notificationWithSender
        });
      }

      return notificationWithSender;
    } catch (error) {
      console.error(`Error creating ${type} notification:`, error);
    }
  }

  static async createLikeNotification(data) {
    const { recipientId, senderId, contentId, io } = data;
    
    try {
      const notification = await Notification.create({
        recipient_id: recipientId,
        sender_id: senderId,
        type: 'LIKE',
        target_id: contentId,
        is_read: false,
        created_at: new Date()
      });

      const notificationWithSender = await Notification.findByPk(notification.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      // Emit WebSocket event
      if (io) {
        io.to(`user_${recipientId}`).emit('notification', {
          type: 'LIKE',
          senderId: senderId,
          notification: notificationWithSender
        });
      }

      return notificationWithSender;
    } catch (error) {
      console.error('Error creating like notification:', error);
    }
  }

  static async createReplyNotification(data) {
    const { recipientId, senderId, threadId, replyId, io } = data;
    
    try {
      const notification = await Notification.create({
        recipient_id: recipientId,
        sender_id: senderId,
        type: 'REPLY',
        target_id: threadId,
        is_read: false,
        created_at: new Date()
      });

      const notificationWithSender = await Notification.findByPk(notification.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      // Emit WebSocket event
      if (io) {
        io.to(`user_${recipientId}`).emit('notification', {
          type: 'REPLY',
          senderId: senderId,
          notification: notificationWithSender
        });
      }

      return notificationWithSender;
    } catch (error) {
      console.error('Error creating reply notification:', error);
    }
  }

  static async createShareNotification(data) {
    const { recipientId, senderId, contentId, io } = data;
    
    try {
      const notification = await Notification.create({
        recipient_id: recipientId,
        sender_id: senderId,
        type: 'SHARE',
        target_id: contentId,
        is_read: false,
        created_at: new Date()
      });

      const notificationWithSender = await Notification.findByPk(notification.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'full_name', 'profile_picture_url']
          }
        ]
      });

      // Emit WebSocket event
      if (io) {
        io.to(`user_${recipientId}`).emit('notification', {
          type: 'SHARE',
          senderId: senderId,
          notification: notificationWithSender
        });
      }

      return notificationWithSender;
    } catch (error) {
      console.error('Error creating share notification:', error);
    }
  }

  static setupSocketIO(io) {
    io.on('connection', (socket) => {
      // Join user to their private room
      socket.on('join_user_room', (userId) => {
        socket.join(`user_${userId}`);
        socket.userId = userId;
      });

      socket.on('disconnect', () => {
        // User disconnected
      });
    });
  }

  // Get the global emitter instance
  static getEmitter() {
    return notificationEmitter;
  }
}

module.exports = { NotificationMiddleware, notificationEmitter };
