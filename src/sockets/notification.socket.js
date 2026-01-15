const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Notification } = require('../models');

class NotificationSocket {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.connectedUsers = new Map(); // userId -> socket.id
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.username} connected with socket ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.user.id.toString(), socket.id);
      
      // Join user to their personal room
      socket.join(`user_${socket.user.id}`);
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.username} disconnected`);
        this.connectedUsers.delete(socket.user.id.toString());
      });

      // Handle marking notifications as read
      socket.on('mark_notification_read', async (data) => {
        try {
          const { notificationId } = data;
          const userId = socket.user.id;

          // Update notification in database
          const notification = await Notification.findOne({
            where: {
              id: notificationId,
              recipient_id: userId
            },
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'name', 'avatar']
              }
            ]
          });

          if (notification) {
            // Update notification
            await notification.update({
              is_read: true,
              read_at: new Date()
            });

            // Emit updated notification back to user
            socket.emit('notification_updated', notification);
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
          socket.emit('error', { message: 'Failed to mark notification as read' });
        }
      });

      // Handle marking all notifications as read
      socket.on('mark_all_notifications_read', async () => {
        try {
          const userId = socket.user.id;

          // Update all unread notifications
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

          // Emit confirmation
          socket.emit('all_notifications_read', { 
            count: result[0],
            message: 'All notifications marked as read'
          });
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
          socket.emit('error', { message: 'Failed to mark all notifications as read' });
        }
      });

      // Handle getting notification count
      socket.on('get_notification_count', async () => {
        try {
          const userId = socket.user.id;
          const unreadCount = await Notification.getUnreadCount(userId);

          socket.emit('notification_count', { count: unreadCount });
        } catch (error) {
          console.error('Error getting notification count:', error);
          socket.emit('error', { message: 'Failed to get notification count' });
        }
      });
    });
  }

  // Method to send notification to specific user
  sendNotification(userId, notificationData) {
    const socketId = this.connectedUsers.get(userId.toString());
    
    if (socketId) {
      this.io.to(socketId).emit('new_notification', notificationData);
      console.log(`Notification sent to user ${userId}`);
    } else {
      console.log(`User ${userId} is not connected`);
    }
  }

  // Method to send notification to multiple users
  sendNotificationToMultipleUsers(userIds, notificationData) {
    userIds.forEach(userId => {
      this.sendNotification(userId, notificationData);
    });
  }

  // Method to broadcast to all connected users
  broadcastNotification(notificationData) {
    this.io.emit('broadcast_notification', notificationData);
  }

  // Method to get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Method to check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }
}

module.exports = NotificationSocket;
