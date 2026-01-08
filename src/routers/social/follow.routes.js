const express = require("express");
const router = express.Router();
const FollowController = require("../../controllers/social/follow.controller");
const { wrapController } = require("../../middlewares/errorHandler.middleware");
const AuthMiddleware = require("../../middlewares/auth.middleware");

const Follow = wrapController(FollowController);

// Apply authentication middleware to all follow routes
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

// Follow a user
router.post( "/:followingId", Follow.followUser);

// Unfollow a user
router.delete("/:followingId", Follow.unFollowUser );

// Get user's followers
router.get("/followers/:userId", Follow.getFollowers);

// Get user's following
router.get( "/following/:userId", Follow.getFollowing);

// Get pending follow requests (for current user)
router.get("/requests", Follow.getFollowRequests);

// Accept follow request
router.put("/requests/:requestId/accept", Follow.acceptFollowRequest);

// Reject follow request
router.put("/requests/:requestId/reject", Follow.rejectFollowRequest );

module.exports = router;
