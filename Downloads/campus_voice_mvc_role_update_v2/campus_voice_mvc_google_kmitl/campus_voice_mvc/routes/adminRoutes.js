
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const {
    getUsers,
    createUser,
    updateUserRole
} = require("../controllers/adminController");

const { auth } = require("../middleware/auth");

// ทดสอบ Route
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Admin Route Connected Successfully"
    });
});

// จัดการสมาชิก
router.get("/users", auth, getUsers);
router.post("/users", auth, createUser);
router.patch("/users/:id/role", auth, updateUserRole);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
