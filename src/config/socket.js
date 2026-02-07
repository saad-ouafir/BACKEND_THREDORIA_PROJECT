const NotificationSocket = require("../sockets/notification.socket");

let notificationSocketInstance = null;

const initializeSocket = io => {
  if (!notificationSocketInstance) {
    notificationSocketInstance = new NotificationSocket(io);
    console.log("Notification socket initialized");
  }
  return notificationSocketInstance;
};

const getNotificationSocket = () => {
  if (!notificationSocketInstance) {
    console.warn("Notification socket not initialized. Returning null.");
    return null;
  }
  return notificationSocketInstance;
};

module.exports = {
  initializeSocket,
  getNotificationSocket,
};
