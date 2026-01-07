const express = require("express");
const router = express.Router();
const ProfileController = require("../../controllers/social/profile.controller");
const ErrorHandler = require("../../middlewares/errorHandler.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");

// Public routes - no authentication required
router.get(
  "/suggestions",
  ErrorHandler.handleAsync(ProfileController.getProfiles)
);


router.get(
  "/search",
  ErrorHandler.handleAsync(ProfileController.searchProfiles)
);
//user by id 
router.get(
  "/:id",
  ErrorHandler.handleAsync(ProfileController.getProfilebyID)
);
//user by username
router.get(
  "/username/:username",
  ErrorHandler.handleAsync(ProfileController.getProfileByUsername)
);

//get profile by tags
router.get(
  "/tags/:tags",
  ErrorHandler.handleAsync(ProfileController.getProfilesByTags)
);

//followers
router.get(
  "/:id/followers",
  ErrorHandler.handleAsync(ProfileController.getFollowers)
);
//following
router.get(
  "/:id/following",
  ErrorHandler.handleAsync(ProfileController.getFollowing)
);

module.exports = router;
