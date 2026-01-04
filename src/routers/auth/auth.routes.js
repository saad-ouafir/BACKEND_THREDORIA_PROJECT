const express = require("express");
const router = express.Router();

const UserController = require("../../controllers/auth/auth.controller");
const ErrorHandler = require("../../middlewares/errorHandler.middleware");
const {
  createAccountLimiter,
  authLimiter,
  tokenRefreshLimiter,
  passwordResetLimiter,
  checkBlock,
} = require("../../middlewares/rateLimit.middleware");

// Apply block checking to all auth routes
router.use(checkBlock);

// Public routes - no authentication required
router.post(
  "/register",
  createAccountLimiter,
  ErrorHandler.handleAsync(UserController.register)
);
router.post(
  "/login",
  authLimiter,
  ErrorHandler.handleAsync(UserController.login)
);
router.post(
  "/refresh",
  tokenRefreshLimiter,
  ErrorHandler.handleAsync(UserController.refresh)
);
router.post("/logout", ErrorHandler.handleAsync(UserController.logout));
router.post(
  "/reset-password",
  passwordResetLimiter,
  ErrorHandler.handleAsync(UserController.resetPassword)
);

module.exports = router;
