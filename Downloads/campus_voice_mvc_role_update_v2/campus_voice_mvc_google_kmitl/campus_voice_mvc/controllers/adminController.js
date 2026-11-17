
const mongoose = require("mongoose");
const User = require("../models/User");
const { categoryRoles } = require("../config/roleMapping");

const allowedRoles = [
    "บุคลากรมหาลัย",
    "เจ้าหน้าที่",
    "แอดมิน",
    ...categoryRoles
];

const adminRoles = ["แอดมิน", "ผู้ดูแลระบบ"];

// ตรวจสอบสิทธิ์ Admin
function isAdmin(user) {
    return user &&
        adminRoles.includes(user.user_role || user.role);
}

// ดึง ID ของผู้ใช้งานปัจจุบัน
function getCurrentUserId(user) {
    return user?.id || user?._id || user?.userId;
}

// GET /api/v1/admin/users
exports.getUsers = async (req, res) => {
    try {
        if (!isAdmin(req.auth)) {
            return res.status(403).json({
                success: false,
                message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
            });
        }

        const users = await User.find({})
            .select("-__v")
            .sort({ createdAt: -1 })
            .lean();

        return res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error("GET USERS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "ไม่สามารถโหลดสมาชิกได้"
        });
    }
};


// POST /api/v1/admin/users
// เพิ่มสมาชิกโดย Admin
exports.createUser = async (req, res) => {
    try {
        if (!isAdmin(req.auth)) {
            return res.status(403).json({
                success: false,
                message: "คุณไม่มีสิทธิ์ดำเนินการ"
            });
        }

        const user_name = String(
            req.body?.user_name || ""
        ).trim();

        const user_email = String(
            req.body?.user_email || ""
        ).trim().toLowerCase();

        const user_role = String(
            req.body?.user_role || "บุคลากรมหาลัย"
        ).trim();

        if (!user_name || user_name.length > 100) {
            return res.status(400).json({
                success: false,
                message: "กรุณาระบุชื่อสมาชิก (ไม่เกิน 100 ตัวอักษร)"
            });
        }

        if (!/^[^\s@]+@kmitl\.ac\.th$/.test(user_email)) {
            return res.status(400).json({
                success: false,
                message: "กรุณาใช้อีเมลมหาวิทยาลัยที่ลงท้ายด้วย @kmitl.ac.th"
            });
        }

        if (!allowedRoles.includes(user_role)) {
            return res.status(400).json({
                success: false,
                message: "Role ไม่ถูกต้อง"
            });
        }

        const existing = await User.findOne({
            user_email
        }).select("_id").lean();

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "อีเมลนี้เป็นสมาชิกในระบบอยู่แล้ว"
            });
        }

        const user = await User.create({
            user_name,
            user_email,
            user_role
        });

        return res.status(201).json({
            success: true,
            message: "เพิ่มสมาชิกเรียบร้อยแล้ว",
            user: {
                _id: user._id,
                user_name: user.user_name,
                user_email: user.user_email,
                user_role: user.user_role
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "อีเมลนี้เป็นสมาชิกในระบบอยู่แล้ว"
            });
        }

        console.error("CREATE USER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "ไม่สามารถเพิ่มสมาชิกได้"
        });
    }
};


// PATCH /api/v1/admin/users/:id/role
// เปลี่ยน Role สมาชิก
exports.updateUserRole = async (req, res) => {
    try {
        if (!isAdmin(req.auth)) {
            return res.status(403).json({
                success: false,
                message: "คุณไม่มีสิทธิ์ดำเนินการ"
            });
        }

        const { user_role } = req.body;

        if (!allowedRoles.includes(user_role)) {
            return res.status(400).json({
                success: false,
                message: "Role ไม่ถูกต้อง"
            });
        }

        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "รหัสสมาชิกไม่ถูกต้อง"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบสมาชิก"
            });
        }

        const currentId = getCurrentUserId(req.auth);

        if (String(user._id) === String(currentId)) {
            return res.status(400).json({
                success: false,
                message: "ไม่สามารถเปลี่ยน Role ของตัวเองได้"
            });
        }

        if (
            adminRoles.includes(user.user_role) &&
            !adminRoles.includes(user_role)
        ) {
            const adminCount = await User.countDocuments({
                user_role: { $in: adminRoles }
            });

            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "ระบบต้องมี Admin อย่างน้อย 1 คน"
                });
            }
        }

        user.user_role = user_role;
        await user.save();

        return res.json({
            success: true,
            message: "เปลี่ยน Role สำเร็จ"
        });

    } catch (error) {
        console.error("UPDATE ROLE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "ไม่สามารถเปลี่ยน Role ได้"
        });
    }
};


// DELETE /api/v1/admin/users/:id
// ลบสมาชิก
exports.deleteUser = async (req, res) => {
    try {
        if (!isAdmin(req.auth)) {
            return res.status(403).json({
                success: false,
                message: "คุณไม่มีสิทธิ์ดำเนินการ"
            });
        }

        const userId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "รหัสสมาชิกไม่ถูกต้อง"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "ไม่พบสมาชิกที่ต้องการลบ"
            });
        }

        const currentId = getCurrentUserId(req.auth);

        // ป้องกันการลบบัญชีตัวเอง
        if (String(user._id) === String(currentId)) {
            return res.status(400).json({
                success: false,
                message: "ไม่สามารถลบบัญชีของตัวเองได้"
            });
        }

        // ป้องกันการลบ Admin คนสุดท้าย
        if (adminRoles.includes(user.user_role)) {
            const adminCount = await User.countDocuments({
                user_role: { $in: adminRoles }
            });

            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "ระบบต้องมี Admin อย่างน้อย 1 คน"
                });
            }
        }

        await User.findByIdAndDelete(userId);

        return res.json({
            success: true,
            message: "ลบสมาชิกเรียบร้อยแล้ว"
        });

    } catch (error) {
        console.error("DELETE USER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "ไม่สามารถลบสมาชิกได้"
        });
    }
};
