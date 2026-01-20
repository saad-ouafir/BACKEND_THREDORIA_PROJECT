const router = require("express").Router();
const MediaController = require("../../controllers/content/media.controller");
const { wrapController } = require("../../middlewares/errorHandler.middleware");
const Media = wrapController(MediaController);

const AuthMiddleware = require("../../middlewares/auth.middleware");
const multer = require("multer");
const uploads = multer({ storage: multer.memoryStorage() });

// Public Accessible routes
router.get("/thread/:threadID", Media.getThreadMedia);

// Routes requiring auth
router.use(AuthMiddleware.authenticateToken);
router.use(AuthMiddleware.attachUser);
router.put("/profile", uploads.single("profile_picture"), Media.uploadProfilePicture);
router.delete("/profile", Media.deleteProfilePicture);
router.post("/thread/:threadID", uploads.array("media", 6), Media.uploadThreadsMedia);
router.delete("/thread/:threadID", Media.deleteThreadMedia);

module.exports = router;
