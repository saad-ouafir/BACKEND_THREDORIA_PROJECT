const express = require("express");
const router = express.Router();

// Imports avec ../../ car on est dans src/routers/social/
const  AuthMiddleware = require("../../middlewares/auth.middleware");
const FollowController = require("../../controllers/social/follow.controller");
const NotificationController = require("../../controllers/social/notification.controller");

// --- Routes Follow ---
router.post(
  "/follow/:id", 
  AuthMiddleware.authenticateToken, 
  FollowController.toggleFollow
);
router.patch(
  "/follow/accept/:followerId", 
  AuthMiddleware.authenticateToken, 
  FollowController.acceptRequest
);

router.delete(
  "/follow/refuse/:followerId", 
  AuthMiddleware.authenticateToken, 
  FollowController.refuseRequest
);


// --- ROUTES NOTIFICATIONS ---
router.get(
  "/notifications", 
  AuthMiddleware.authenticateToken, 
  NotificationController.getNotifications
);

router.patch(
  "/notifications/:id/read", 
  AuthMiddleware.authenticateToken, 
  NotificationController.markNotificationAsRead
);

module.exports = router;