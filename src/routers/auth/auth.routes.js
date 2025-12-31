const express = require("express");
const router = express.Router();

const UserController = require("../../controllers/auth/auth.controller");
const ErrorHandler = require("../../middlewares/errorHandler.middleware");

// Public routes - no authentication required
router.post("/register", ErrorHandler.handleAsync(UserController.register));
router.post("/login", ErrorHandler.handleAsync(UserController.login));
router.post(
  "/reset-password",
  ErrorHandler.handleAsync(UserController.resetPassword)
);

module.exports = router;
