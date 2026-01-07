const express = require("express");
const router = express.Router();
const AuthMiddleware = require("../../middlewares/auth.middleware");

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
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

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


router.put("/update/:id", authLimiter,ErrorHandler.handleAsync(UserController.update));
router.delete("/delete/:id", authLimiter,ErrorHandler.handleAsync(UserController.delete));



module.exports = router;
