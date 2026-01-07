const express = require("express");
const router = express.Router();
const ProfileController = require("../../controllers/social/profile.controller");
const { wrapController } = require("../../middlewares/errorHandler.middleware");

const Profile = wrapController(ProfileController);

router.get("/suggest", Profile.suggestProfiles);
router.get("/search", Profile.searchProfiles);
router.get("/:id", Profile.getProfilebyID);

module.exports = router;
