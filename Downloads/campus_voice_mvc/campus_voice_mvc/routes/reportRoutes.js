const express = require("express");
const controller = require("../controllers/reportController");
const { auth, staffOnly } = require("../middleware/auth");
const imageUpload = require("../middleware/uploadImages");
const router = express.Router();

router.get("/", controller.getReports);
router.get("/me", auth, controller.getMyReports);
router.post("/", auth, controller.createReport);
router.get("/:id", controller.getReportById);
router.patch("/:id/status", auth, staffOnly, controller.updateStatus);
router.delete("/:id", auth, staffOnly, controller.deleteReport);
router.post("/:id/images", auth, imageUpload.array("images", 5), controller.addImages);

module.exports = router;
