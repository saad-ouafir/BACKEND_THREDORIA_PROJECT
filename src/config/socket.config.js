const NotificationSocket = require('../sockets/notification.socket');

let notificationSocketInstance = null;

const initializeSocket = (server) => {
  if (!notificationSocketInstance) {
    notificationSocketInstance = new NotificationSocket(server);
    console.log('Notification socket initialized');
  }
  return notificationSocketInstance;
};

const getNotificationSocket = () => {
  if (!notificationSocketInstance) {
    throw new Error('Notification socket not initialized. Call initializeSocket first.');
  }
  return notificationSocketInstance;
};

module.exports = {
  initializeSocket,
  getNotificationSocket
};
