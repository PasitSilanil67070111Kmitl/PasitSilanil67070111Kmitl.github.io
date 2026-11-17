
require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("./middleware/cookieParser");
const connectDatabase = require("./config/database");
const seedCategories = require("./config/seedCategories");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const reportRoutes = require("./routes/reportRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  throw new Error("กรุณากำหนด JWT_SECRET ในไฟล์ .env");
}

// สถานะการเชื่อมต่อฐานข้อมูล
let dbAvailable = false;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser);

// ตรวจสอบสถานะ Server
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    database: dbAvailable ? "connected" : "disconnected",
    service: "เสียงของมหาลัย API"
  });
});

// ตรวจสอบว่าฐานข้อมูลพร้อมใช้งานหรือไม่
app.use((req, res, next) => {
  if (dbAvailable) {
    return next();
  }

  // API ส่งข้อความ JSON
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(503).json({
      status: "error",
      message: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่ภายหลัง"
    });
  }

  // หน้าเว็บไซต์แสดงข้อความแจ้งเตือน
  return res.status(503).send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>503 - Service Unavailable</title>

      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f5f7fa;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          text-align: center;
        }

        .error-container {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          max-width: 400px;
          margin: 20px;
        }

        h1 {
          font-size: 64px;
          color: #eb6725;
          margin: 0;
        }

        h2 {
          color: #333;
        }

        p {
          color: #64748b;
          line-height: 1.6;
        }

        a {
          display: inline-block;
          background: #eb6725;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin-top: 15px;
        }
      </style>
    </head>

    <body>
      <div class="error-container">
        <h1>503</h1>
        <h2>Service Unavailable</h2>

        <p>
          ขออภัย ระบบไม่สามารถเชื่อมต่อฐานข้อมูลได้ในขณะนี้
        </p>

        <p>
          กรุณาลองใหม่อีกครั้งภายหลัง
        </p>

        <a href="/">ลองอีกครั้ง</a>
      </div>
    </body>
    </html>
  `);
});

// ไฟล์เว็บไซต์
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/reports", reportRoutes);

// Error Handler
app.use((err, _req, res, _next) => {
  console.error(err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "รูปภาพต้องมีขนาดไม่เกิน 5MB"
    });
  }

  if (
    err.code === "LIMIT_FILE_COUNT" ||
    err.code === "LIMIT_UNEXPECTED_FILE"
  ) {
    return res.status(400).json({
      message: "แนบรูปภาพได้สูงสุด 5 รูป"
    });
  }

  return res.status(400).json({
    message: err.message || "เกิดข้อผิดพลาด"
  });
});

// 404 Not Found
app.use((req, res) => {
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({
      message: "ไม่พบ API ที่คุณต้องการ"
    });
  }

  return res.status(404).send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Page Not Found</title>

      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f5f7fa;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          text-align: center;
        }

        .error-container {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        h1 {
          font-size: 64px;
          color: #eb6725;
          margin: 0;
        }

        p {
          color: #64748b;
          margin: 15px 0 25px;
        }

        a {
          display: inline-block;
          background: #eb6725;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
        }
      </style>
    </head>

    <body>
      <div class="error-container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>ขออภัย ไม่พบหน้าที่คุณต้องการ</p>
        <a href="/">กลับสู่หน้าหลัก</a>
      </div>
    </body>
    </html>
  `);
});

// เริ่มต้น Server ก่อนเชื่อมต่อฐานข้อมูล
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await connectDatabase();
    await seedCategories();

    dbAvailable = true;

    console.log("Database connected successfully");
    console.log("ระบบพร้อมใช้งาน");

  } catch (error) {
    dbAvailable = false;

    console.error("Database connection failed:", error.message);
    console.log("ระบบจะแสดงหน้า 503 จนกว่าจะเชื่อมต่อฐานข้อมูลได้");
  }
});

