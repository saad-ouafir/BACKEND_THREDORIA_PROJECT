const router = require("express").Router();
const NotificationController = require("../../controllers/social/notification.controller");
const { wrapController } = require("../../middlewares/errorHandler.middleware");
const AuthMiddleware = require("../../middlewares/auth.middleware");

// Wrap controllers for global error Handeling
const Notification = wrapController(NotificationController);

// Applying Authentitication & Authorization middlewares
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

router.get("/", Notification.getUserNotifications);
router.put("/read/:notificationId", Notification.markNotificationAsRead);
router.put("/read/all", Notification.markAllNotificationsAsRead);
router.delete("/:notificationId", Notification.deleteNotifications);

module.exports = router;
