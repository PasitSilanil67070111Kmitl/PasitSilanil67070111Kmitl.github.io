const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { COOKIE_NAME, cookieOptions } = require("../middleware/auth");

function publicUser(user) {
  return {
    id: user._id,
    user_name: user.user_name,
    user_email: user.user_email,
    user_role: user.user_role
  };
}

function setLoginCookie(res, user) {
  const token = jwt.sign(
    { id: user._id, role: user.user_role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

async function register(req, res) {
  try {
    const { user_name, user_email, user_password } = req.body;
    if (!user_name || !user_email || !user_password) {
      return res.status(400).json({ message: "กรอกชื่อ อีเมล และรหัสผ่านให้ครบ" });
    }
    if (String(user_password).length < 6) {
      return res.status(400).json({ message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    const normalizedEmail = String(user_email).trim().toLowerCase();
    const exists = await User.findOne({ user_email: normalizedEmail });
    if (exists) return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });

    const hashed = await bcrypt.hash(user_password, 12);
    const user = await User.create({
      user_name,
      user_email: normalizedEmail,
      user_password: hashed
    });

    setLoginCookie(res, user);
    return res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      user: publicUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function login(req, res) {
  try {
    const { user_email, user_password } = req.body;
    const normalizedEmail = String(user_email || "").trim().toLowerCase();
    const user = await User.findOne({ user_email: normalizedEmail });

    if (!user || !(await bcrypt.compare(user_password || "", user.user_password))) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    setLoginCookie(res, user);
    return res.json({ message: "เข้าสู่ระบบสำเร็จ", user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.auth.id);
    if (!user) return res.status(401).json({ message: "ไม่พบบัญชีผู้ใช้" });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  return res.json({ message: "ออกจากระบบแล้ว" });
}

module.exports = { register, login, me, logout };
