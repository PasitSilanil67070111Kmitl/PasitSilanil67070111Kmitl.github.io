
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { COOKIE_NAME, cookieOptions } = require("../middleware/auth");

const googleClient = new OAuth2Client();
const ALLOWED_DOMAIN = "kmitl.ac.th";

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
    { id: String(user._id), role: user.user_role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie(COOKIE_NAME, token, cookieOptions());
}

function googleConfig(_req, res) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      message: "ระบบ Google Login ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID"
    });
  }

  return res.json({
    clientId: process.env.GOOGLE_CLIENT_ID
  });
}

async function googleLogin(req, res) {
  try {
    const credential = req.body?.credential;

    if (!credential) {
      return res.status(400).json({
        message: "ไม่พบ Google Credential"
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        message: "ระบบ Google Login ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "ระบบยังไม่ได้ตั้งค่า JWT_SECRET"
      });
    }

    // ตรวจสอบ Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub) {
      return res.status(401).json({
        message: "ไม่สามารถยืนยันตัวตน Google ได้"
      });
    }

    const email = String(payload.email || "")
      .trim()
      .toLowerCase();

    const hostedDomain = String(payload.hd || "")
      .trim()
      .toLowerCase();

    // ตรวจสอบข้อมูล Google ใน Terminal
    console.log("Google Login Debug:", {
      email,
      email_verified: payload.email_verified,
      hostedDomain,
      audience: payload.aud
    });

    // อนุญาตเฉพาะอีเมล KMITL ที่ Google ยืนยันแล้ว
    if (
      payload.email_verified !== true ||
      !email.endsWith(`@${ALLOWED_DOMAIN}`)
    ) {
      return res.status(403).json({
        message: "อนุญาตเฉพาะบัญชี Google ที่ลงท้ายด้วย @kmitl.ac.th เท่านั้น"
      });
    }

    // ค้นหาบัญชีเดิมด้วย Google ID หรือ Email
    let user = await User.findOne({
      $or: [
        { google_id: payload.sub },
        { user_email: email }
      ]
    });

    if (user) {
      // ป้องกัน Google ID ที่ไม่ตรงกับอีเมลบัญชีเดิม
      if (
        String(user.user_email).trim().toLowerCase() !== email
      ) {
        return res.status(409).json({
          message: "บัญชี Google นี้ไม่ตรงกับอีเมลของบัญชีเดิม"
        });
      }

      // ป้องกันการเชื่อมบัญชี Google ซ้ำ
      if (
        user.google_id &&
        user.google_id !== payload.sub
      ) {
        return res.status(409).json({
          message: "อีเมลนี้เชื่อมกับบัญชี Google อื่นแล้ว"
        });
      }

      // เชื่อม Google ID เข้ากับบัญชีเดิม
      if (!user.google_id) {
        user.google_id = payload.sub;

        if (!user.user_name && payload.name) {
          user.user_name = payload.name;
        }

        await user.save();
      }

    } else {
      // สร้างบัญชีใหม่โดยใช้ Role เริ่มต้นจาก Model
      user = await User.create({
        user_name: payload.name || email.split("@")[0],
        user_email: email,
        google_id: payload.sub
      });
    }

    // เข้าสู่ระบบ
    setLoginCookie(res, user);

    return res.json({
      message: "เข้าสู่ระบบด้วย Google สำเร็จ",
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Google login failed:", error);

    return res.status(401).json({
      message: "เข้าสู่ระบบ Google ไม่สำเร็จ กรุณาตรวจสอบ Google Client ID และลองใหม่"
    });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.auth.id);

    if (!user) {
      return res.status(401).json({
        message: "ไม่พบบัญชีผู้ใช้"
      });
    }

    return res.json({
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Get user failed:", error);

    return res.status(500).json({
      message: "ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้"
    });
  }
}

function logout(_req, res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return res.json({
    message: "ออกจากระบบแล้ว"
  });
}

module.exports = {
  googleConfig,
  googleLogin,
  me,
  logout
};
