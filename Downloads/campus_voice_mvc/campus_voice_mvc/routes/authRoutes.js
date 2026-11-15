const express = require("express");
const controller = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const router = express.Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/me", auth, controller.me);
router.post("/logout", controller.logout);

module.exports = router;
