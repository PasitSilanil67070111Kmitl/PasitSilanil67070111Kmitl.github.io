const jwt = require("jsonwebtoken");

const COOKIE_NAME = "cv_token";

function auth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "กรุณาเข้าสู่ระบบ" });

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.clearCookie(COOKIE_NAME, cookieOptions());
    return res.status(401).json({ message: "Session ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
  }
}

function staffOnly(req, res, next) {
  if (!["แอดมิน", "เจ้าหน้าที่"].includes(req.auth.role)) {
    return res.status(403).json({ message: "ไม่มีสิทธิ์ดำเนินการ" });
  }
  next();
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

module.exports = { auth, staffOnly, COOKIE_NAME, cookieOptions };
