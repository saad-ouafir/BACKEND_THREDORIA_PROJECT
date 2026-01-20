const router = require("express").Router();
const { wrapController } = require("../../middlewares/errorHandler.middleware");
const ThreadController = require("../../controllers/content/thread.controller");
const AuthMiddleware = require("../../middlewares/auth.middleware");

// Apply authentication middleware
// router.use(AuthMiddleware.authenticateToken);
// router.use(AuthMiddleware.attachUser);

const Thread = wrapController(ThreadController);
router.get("/user/:userId", Thread.getThreadsByUserID);
router.get("/thread/:threadId", Thread.getThreadById);
router.get("/subThreads/:parentID", Thread.getSubThreads);
router.get("/search", Thread.searchThreads);
router.get("/suggest", Thread.suggestThreadByTag);

router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);
router.post("/create", Thread.createThread);
router.delete("/delete/:threadId", Thread.deleteThreadById);

module.exports = router;
