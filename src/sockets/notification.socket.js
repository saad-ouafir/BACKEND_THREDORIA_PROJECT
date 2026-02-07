const { Server } = require("socket.io");

class NotificationSocket {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // Map userId to socket id(s)
    this.onlineUsers = new Set(); // Set of online user IDs

    this.io.on("connection", (socket) => {
      // User joins their personal notification room
      socket.on("join", (userId) => {
        if (userId) {
          socket.join(`user_${userId}`);
          this.userSockets.set(userId, socket.id);

          // Track user as online
          const wasOnline = this.onlineUsers.has(userId);
          this.onlineUsers.add(userId);

          // Broadcast online status to all clients if user just came online
          if (!wasOnline) {
            this.io.emit("user_online", { userId, online: true });
          }

          console.log(`User ${userId} joined notification room (online)`);
        }
      });

      // User leaves their notification room
      socket.on("leave", (userId) => {
        if (userId) {
          socket.leave(`user_${userId}`);
          this.userSockets.delete(userId);

          // Mark user as offline
          this.onlineUsers.delete(userId);
          this.io.emit("user_online", { userId, online: false });

          console.log(`User ${userId} left notification room (offline)`);
        }
      });

      // Request online status of specific users
      socket.on("check_online", (userIds) => {
        if (Array.isArray(userIds)) {
          const onlineStatus = {};
          userIds.forEach((userId) => {
            onlineStatus[userId] = this.onlineUsers.has(userId);
          });
          socket.emit("online_status", onlineStatus);
        }
      });

      // Request list of all online users
      socket.on("get_online_users", () => {
        socket.emit("online_users_list", Array.from(this.onlineUsers));
      });

      socket.on("disconnect", () => {
        // Clean up user from userSockets map and online users
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            this.onlineUsers.delete(userId);
            // Broadcast offline status
            this.io.emit("user_online", { userId, online: false });
            console.log(`User ${userId} disconnected (offline)`);
            break;
          }
        }
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  // Check if a user is online
  isUserOnline(userId) {
    return this.onlineUsers.has(userId);
  }

  // Get all online users
  getOnlineUsers() {
    return Array.from(this.onlineUsers);
  }

  sendNotification(recipientId, notification) {
    this.io.to(`user_${recipientId}`).emit("new_notification", notification);
  }

  cancelNotification(recipientId, data) {
    this.io.to(`user_${recipientId}`).emit("cancel_notification", data);
  }
  updateNotification(recipientId, data) {
    this.io.to(`user_${recipientId}`).emit("update_notification", data);
  }
}

module.exports = NotificationSocket;
