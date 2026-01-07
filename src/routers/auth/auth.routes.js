const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../../middlewares/auth.middleware");
const UserController = require("../../controllers/auth/auth.controller");
const { wrapController } = require("../../middlewares/errorHandler.middleware");
const {
  createAccountLimiter,
  authLimiter,
  tokenRefreshLimiter,
  passwordResetLimiter,
} = require("../../middlewares/rateLimit.middleware");

// Wrap controllers with error handling
const User = wrapController(UserController);

// Public accessible Routes
router.post("/register", createAccountLimiter, User.register);
router.post("/login", authLimiter, User.login);

// Authentication middleware on protected routes
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

// Protected Routes
router.post("/refresh", tokenRefreshLimiter, User.refresh);
router.post("/logout", User.logout);
router.post("/reset-password", passwordResetLimiter, User.resetPassword);
router.put("/update/:id", authLimiter, User.update);
router.delete("/delete/:id", authLimiter, User.delete);

module.exports = router;
