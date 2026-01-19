const express = require('express');
const router = express.Router();
const ReactionController = require('../../controllers/content/reaction.controller');
const { wrapController } = require('../../middlewares/errorHandler.middleware');
const AuthMiddleware = require('../../middlewares/auth.middleware');

const reaction = wrapController(ReactionController);

// Authentication middleware
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

// Add reaction to a thread
router.post('/threads/:threadId', reaction.addReaction);

// Toggle reaction (add if doesn't exist, remove if it does)
router.post('/threads/:threadId/toggle', reaction.toggleReaction);

// Remove reaction from a thread
router.delete('/threads/:threadId/reactions/:reactionId', reaction.removeReaction);

// Get all reactions for a thread
router.get('/threads/:threadId/reactions', reaction.getThreadReactions);

// Get current user's reactions
router.get('/user/reactions', reaction.getUserReactions);

module.exports = router;
