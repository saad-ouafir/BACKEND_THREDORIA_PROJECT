const router = require("express").Router();
const AuthMiddleware = require("../../middlewares/auth.middleware");

const ProfileController = require("../../controllers/social/profile.controller");
const { wrapController } = require("../../middlewares/errorHandler.middleware");

// Import validation middleware and schemas
const {
  validateParams,
  validateQuery,
  searchProfilesSchema,
  suggestProfilesSchema,
  profileIdSchema,
} = require("../../validations");

const Profile = wrapController(ProfileController);

router.use(AuthMiddleware.attachUser);
router.get("/suggest", Profile.suggestProfiles);
router.get("/search", Profile.searchProfiles);
router.get("/:id", Profile.getProfilebyID);

module.exports = router;
