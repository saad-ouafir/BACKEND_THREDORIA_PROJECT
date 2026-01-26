const EventEmitter = require("events");
const eventsHandler = new EventEmitter();

const NotificationController = require("../controllers/social/notification.controller");

// Online Events
eventsHandler.on("token_refresh", (userId) => {});

// Notification Related Events
eventsHandler.on("notification", (type, sender_id, recipient_id, target_id) => {
  NotificationController.createNotication(type, sender_id, recipient_id, target_id);
});

eventsHandler.on("cancelNotification", (type, sender_id, recipient_id, target_id) => {
  NotificationController.cancelNotification(type, sender_id, recipient_id, target_id);
});

// Error Events
eventsHandler.on("error", (err) => {
  console.log("error", err);
});

module.exports = { eventsHandler };
