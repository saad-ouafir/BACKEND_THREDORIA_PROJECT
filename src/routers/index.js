// Import express router + che
const router = require("express").Router();

// Importing All routes
const routes = {
  authRoutes: require("./auth/auth.routes"),
  profileRoutes: require("./social/profile.routes"),
  threadRoutes: require("./content/thread.routes"),
  followRoutes: require("./social/follow.routes"),
  mediaRoutes: require("./content/media.routes"),
  reactionRoutes: require("./content/reaction.routes"),
  notificationRoutes: require("./social/notification.routes"),
};

// Assigning each route to the appropriate functionnality
router.use("/auth", routes.authRoutes);
router.use("/profile", routes.profileRoutes);
router.use("/threads", routes.threadRoutes);
router.use("/follow", routes.followRoutes);
router.use("/media", routes.mediaRoutes);
router.use("/reactions", routes.reactionRoutes);
router.use("/notifications", routes.notificationRoutes);

module.exports = router;
