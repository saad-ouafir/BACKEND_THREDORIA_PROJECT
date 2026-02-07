const EventEmitter = require("events");
const eventsHandler = new EventEmitter();

const NotificationController = require("../controllers/social/notification.controller");
const { getNotificationSocket } = require("../config/socket");

// Online Events
eventsHandler.on("token_refresh", userId => {});

// Notification Related Events
eventsHandler.on("notification", async (type, sender_id, recipient_id, target_id) => {
  // Don't send notification to yourself
  if (sender_id === recipient_id) return;

  // Create notification in database
  const notification = await NotificationController.createNotication(type, sender_id, recipient_id, target_id);

  // Send real-time notification via WebSocket
  const notificationSocket = getNotificationSocket();
  if (notificationSocket && notification) {
    notificationSocket.sendNotification(recipient_id, notification);
  }
});

eventsHandler.on("cancelNotification", async (type, sender_id, recipient_id, target_id) => {
  // Cancel notification in database
  await NotificationController.cancelNotification(type, sender_id, recipient_id, target_id);

  // Notify client to remove the notification via WebSocket
  const notificationSocket = getNotificationSocket();
  if (notificationSocket) {
    notificationSocket.cancelNotification(recipient_id, {
      type,
      sender_id,
      target_id,
    });
  }
});

// Error Events
eventsHandler.on("error", err => {
  console.error("EventsHandler error:", err);
});

module.exports = { eventsHandler };
