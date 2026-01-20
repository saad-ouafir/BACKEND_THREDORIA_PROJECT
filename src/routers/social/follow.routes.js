const router = require("express").Router();
const FollowController = require("../../controllers/social/follow.controller");
const { wrapController } = require("../../middlewares/errorHandler.middleware");
const AuthMiddleware = require("../../middlewares/auth.middleware");

// Wrap Follow class controller for error handling
const Follow = wrapController(FollowController);

// Apply authentication middleware to all follow routes
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

// Follow / Unfollow Routes
router.post("/follow", Follow.followUser);
router.post("/unfollow", Follow.unfollowUser);

// Get Following / Followers Routes
router.get("/:userId/followers", Follow.getFollowers);
router.get("/:userId/following", Follow.getFollowing);

// Get / Accept / Reject Follow Requests Routes
router.get("/requests", Follow.getFollowRequests);
router.post("/requests/accept", Follow.acceptFollowRequest);
router.post("/requests/reject", Follow.rejectFollowRequest);

module.exports = router;
