const express = require("express");
const router = express.Router();
const UserController = require("../../controllers/auth/auth.controller");
const ErrorHandler = require("../../middlewares/errorHandler.middleware");


router.get(
  "/profile",
  ErrorHandler.handleAsync(async (req, res) => {
    return res.status(200).json({
      user: req.currentUser,
    });
  })
);


module.exports = router;
