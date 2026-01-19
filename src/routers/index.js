const router = require("express").Router();
const { checkBlock } = require("../middlewares/rateLimit.middleware");

const routes = {
  authRoutes: require("./auth/auth.routes"),
  profileRoutes: require("./social/profile.routes"),
  threadRoutes: require("./content/thread.routes"),
  followRoutes: require("./social/follow.routes"),
  notificationRoutes: require("./social/notifications.routes"),
  reactionRoutes: require("./content/reaction.routes"),
  replyRoutes: require("./content/reply.routes"),
  shareRoutes: require("./content/share.routes"),
};

router.use(checkBlock);
router.use("/auth", routes.authRoutes);
router.use("/profile", routes.profileRoutes);
router.use("/thread", routes.threadRoutes);
router.use("/follow", routes.followRoutes);
router.use("/notification", routes.notificationRoutes);
router.use("/reactions", routes.reactionRoutes);
router.use("/replies", routes.replyRoutes);
router.use("/shares", routes.shareRoutes);

module.exports = router;
