const express = require("express");
const router = express.Router();

const routes = {
  authRoutes: require("./auth/auth.routes"),
  protectedRoutes: require("./auth/protected.routes"),
  profileRoutes: require("./social/profile.routes"),
};

// Public routes (without Auth)


// Social routes (public)
router.use("/profile", routes.profileRoutes);

// Protected routes (with Auth)

// Protected routes - require authentication

router.use("/auth", routes.authRoutes);

module.exports = router;
