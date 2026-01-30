const router = require("express").Router();
const AutMiddleware = require("../../middlewares/auth.middleware");

const ProfileController = require("../../controllers/social/profile.controller");
const { wrapController } = require("../../middlewares/errorHandler.middleware");

const Profile = wrapController(ProfileController);

router.use(AutMiddleware.attachUser);
router.get("/suggest", Profile.suggestProfiles);
router.get("/search", Profile.searchProfiles);
router.get("/:id", Profile.getProfilebyID);

module.exports = router;
