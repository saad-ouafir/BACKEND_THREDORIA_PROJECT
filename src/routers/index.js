const express = require("express");
const router = express.Router();
const { checkBlock } = require("../middlewares/rateLimit.middleware");

// --- CORRECTION ICI ---
// On pointe vers le fichier src/routers/social/routes.js
const socialRoutes = require("./social/routes"); 

const routes = {
  authRoutes: require("./auth/auth.routes"),
  profileRoutes: require("./social/profile.routes"),
};

router.use(checkBlock);

router.use("/auth", routes.authRoutes);
router.use("/profile", routes.profileRoutes);

// On branche les routes sociales (notifications & follow) sur /social
router.use("/social", socialRoutes); 

module.exports = router;