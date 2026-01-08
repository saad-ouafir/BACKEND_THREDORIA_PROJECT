const router = require("express").Router();
const { checkBlock } = require("../middlewares/rateLimit.middleware");

const routes = {
  authRoutes: require("./auth/auth.routes"),
  profileRoutes: require("./social/profile.routes"),
  threadRoutes: require("./content/thread.routes"),
};

router.use(checkBlock);
router.use("/auth", routes.authRoutes);
router.use("/profile", routes.profileRoutes);
router.use("/thread", routes.threadRoutes);

module.exports = router;
