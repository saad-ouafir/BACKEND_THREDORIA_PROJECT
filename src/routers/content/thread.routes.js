const router = require("express").Router();
const { wrapController } = require("../../middlewares/errorHandler.middleware");
const ThreadController = require("../../controllers/content/thread.controller");
const AuthMiddleware = require("../../middlewares/auth.middleware");

// Import validation middleware and schemas
const {
  validateBody,
  validateQuery,
  validateParams,
  createThreadSchema,
  searchThreadsSchema,
  threadIdSchema,
  userIdSchema,
  parentIdSchema,
  paginationSchema,
} = require("../../validations");

const Thread = wrapController(ThreadController);
router.use(AuthMiddleware.attachUser);

router.get("/user/:userId", Thread.getThreadsByUserID);
router.get("/thread/:threadId", Thread.getThreadById);
router.get("/subThreads/:parentID", Thread.getSubThreads);
router.get("/search", Thread.searchThreads);
router.get("/suggest", Thread.suggestThreadByTag);

router.use(AuthMiddleware.authenticateToken);
router.post("/create", Thread.createThread);
router.delete("/delete/:threadId", Thread.deleteThreadById);

module.exports = router;
