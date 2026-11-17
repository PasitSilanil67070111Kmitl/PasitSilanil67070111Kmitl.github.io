const mongoose = require("mongoose");

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("กรุณากำหนด MONGODB_URI ในไฟล์ .env");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

module.exports = connectDatabase;
