const express = require("express");
const controller = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const router = express.Router();

router.get("/google/config", controller.googleConfig);
router.post("/google", controller.googleLogin);
router.get("/me", auth, controller.me);
router.post("/logout", controller.logout);

module.exports = router;
