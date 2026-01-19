const express = require('express');
const router = express.Router();
const ReplyController = require('../../controllers/content/reply.controller');
const { wrapController } = require('../../middlewares/errorHandler.middleware');
const AuthMiddleware = require('../../middlewares/auth.middleware');

const reply = wrapController(ReplyController);

// Authentication middleware
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

// Add reply to a thread
router.post('/threads/:threadId/replies', reply.addReply);

// Get all replies for a thread
router.get('/threads/:threadId/replies', reply.getThreadReplies);


// Update a reply
router.put('/threads/:threadId/replies/:replyId', reply.updateReply);

// Delete a reply
router.delete('/threads/:threadId/replies/:replyId', reply.deleteReply);

// Get reply statistics for a thread
router.get('/threads/:threadId/replies/stats', reply.getReplyStats);

module.exports = router;
