const express = require('express');
const router = express.Router();
const NotificationController = require('../../controllers/social/notification.controller');
const {wrapController} = require('../../middlewares/errorHandler.middleware');
const AuthMiddleware = require('../../middlewares/auth.middleware');

const notification = wrapController(NotificationController);

router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

// Get user notifications
router.get('/', notification.getUserNotifications);

// Get unread notification count
router.get('/count', notification.getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', notification.markNotificationAsRead );

// Mark all notifications as read
router.put('/read-all', notification.clearAllNotifications);

// Delete notification
router.delete('/:notificationId', notification.deleteNotification);

// Create follow notification (when follow is accepted)
router.post('/follow/:followingId', notification.createFollowNotification);

// Create follow request notification (when someone requests to follow private account)
router.post('/follow-request/:followingId',notification.createFollowRequestNotification);

// Create like notification
router.post('/like/:contentId/:contentType/:contentOwnerId', notification.createLikeNotification);

// Create reply notification
router.post('/reply/:threadId/:replyId/:originalAuthorId', notification.createReplyNotification);

// Create share notification
router.post('/share/:contentId/:originalAuthorId', notification.createShareNotification);

module.exports = router;