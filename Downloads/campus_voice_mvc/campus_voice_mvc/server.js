require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("./middleware/cookieParser");
const connectDatabase = require("./config/database");
const seedCategories = require("./config/seedCategories");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  throw new Error("กรุณากำหนด JWT_SECRET ในไฟล์ .env");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser);

// View เดิม: HTML, CSS และ JavaScript อยู่ใน public
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/reports", reportRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "เสียงของมหาลัย API" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "รูปภาพต้องมีขนาดไม่เกิน 5MB" });
  }
  if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ message: "แนบรูปภาพได้สูงสุด 5 รูป" });
  }
  return res.status(400).json({ message: err.message || "เกิดข้อผิดพลาด" });
});

async function startServer() {
  try {
    await connectDatabase();
    await seedCategories();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
