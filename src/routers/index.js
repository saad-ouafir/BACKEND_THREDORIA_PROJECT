const express = require("express");
const router = express.Router();
const { checkBlock } = require("../middlewares/rateLimit.middleware");

const routes = {
  authRoutes: require("./auth/auth.routes"),
  profileRoutes: require("./social/profile.routes"),
};

router.use(checkBlock);
router.use("/auth", routes.authRoutes);
router.use("/profile", routes.profileRoutes);

module.exports = router;
