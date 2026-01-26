const router = require("express").Router();
const ReactionController = require("../../controllers/content/reaction.controller");
const AuthMiddleware = require("../../middlewares/auth.middleware");
const { wrapController } = require("../../middlewares/errorHandler.middleware");

const Reaction = wrapController(ReactionController);

// Protected routes
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);
router.post("/like/:threadId", Reaction.likeOrUnlikeThread);
router.post("/share/:threadId", Reaction.shareThread);

module.exports = router;
