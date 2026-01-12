const router = require("express").Router();
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
router.post("/refresh", tokenRefreshLimiter, User.refresh);

// Authentication middleware on protected routes
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

// Protected Routes
router.post("/logout", User.logout);
router.post("/reset-password", authLimiter, passwordResetLimiter, User.resetPassword);
router.put("/update", authLimiter, User.update);
router.delete("/delete", authLimiter, User.delete);

module.exports = router;
