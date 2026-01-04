const express = require("express");
const router = express.Router();
const UserController = require("../../controllers/auth/auth.controller");
const ErrorHandler = require("../../middlewares/errorHandler.middleware");
const AuthMiddleware = require("../../middlewares/auth.middleware");

// Protected routes - require authentication
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

router.get(
  "/profile",
  ErrorHandler.handleAsync(async (req, res) => {
    return res.status(200).json({
      user: req.currentUser,
    });
  })
);

router.delete("/delete/:id", ErrorHandler.handleAsync(UserController.delete));

module.exports = router;
