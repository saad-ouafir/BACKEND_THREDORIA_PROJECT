const router = require("express").Router();
const { checkBlock } = require("../middlewares/rateLimit.middleware");

const routes = {
  authRoutes: require("./auth/auth.routes"),
  profileRoutes: require("./social/profile.routes"),
  threadRoutes: require("./content/thread.routes"),
  followRoutes: require("./social/follow.routes"),
  mediaRoutes: require("./content/media.routes"),
  reactionRoutes: require("./content/reaction.routes"),
};

router.use(checkBlock);
router.use("/auth", routes.authRoutes);
router.use("/profile", routes.profileRoutes);
router.use("/threads", routes.threadRoutes);
router.use("/follow", routes.followRoutes);
router.use("/media", routes.mediaRoutes);
router.use("/reactions", routes.reactionRoutes);

module.exports = router;
