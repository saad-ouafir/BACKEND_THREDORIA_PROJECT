const express = require('express');
const router = express.Router();
const ShareController = require('../../controllers/content/share.controller');
const { wrapController } = require('../../middlewares/errorHandler.middleware');
const AuthMiddleware = require('../../middlewares/auth.middleware');

const share = wrapController(ShareController);

// Authentication middleware
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);

// Generate shareable link for a thread (no authentication required for link generation)
router.get('/threads/:threadId/link', ShareController.generateShareableLink);

// Share a thread
router.post('/threads/:threadId', share.shareThread);

// Toggle share (share if not shared, unshare if already shared)
router.post('/threads/:threadId/toggle', share.toggleShare);

// Unshare a thread
router.delete('/threads/:threadId/shares/:shareId', share.unshareThread);

// Get all shares for a thread
router.get('/threads/:threadId/shares', share.getThreadShares);

// Get current user's shared threads
router.get('/user/shares', share.getUserShares);

// Get share statistics for a thread
router.get('/threads/:threadId/shares/stats', share.getShareStats);

module.exports = router;
