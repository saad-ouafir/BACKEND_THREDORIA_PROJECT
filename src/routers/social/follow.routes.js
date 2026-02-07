const router = require("express").Router();
const FollowController = require("../../controllers/social/follow.controller");
const { wrapController } = require("../../middlewares/errorHandler.middleware");
const AuthMiddleware = require("../../middlewares/auth.middleware");

// Import validation middleware and schemas
const {
  validateBody,
  validateParams,
  validateQuery,
  toggleFollowSchema,
  followRequestSchema,
  removeFollowerSchema,
  userIdParamSchema,
  followPaginationSchema,
} = require("../../validations");

// Wrap Follow class controller for error handling
const Follow = wrapController(FollowController);

// Apply authentication middleware to all follow routes
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

// Follow / Unfollow Routes
router.post("/follow", Follow.toggleFollow);

// Get Following / Followers Routes
router.get("/:userId/followers", Follow.getFollowers);
router.get("/:userId/following", Follow.getFollowing);

// Get / Accept / Reject Follow Requests Routes
router.get("/requests", Follow.getFollowRequests);
router.post("/requests/accept", Follow.acceptFollowRequest);
router.post("/requests/reject", Follow.rejectFollowRequest);

// Remove a follower
router.post("/remove-follower", Follow.removeFollower);

module.exports = router;
