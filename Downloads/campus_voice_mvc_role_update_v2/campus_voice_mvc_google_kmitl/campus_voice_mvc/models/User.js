const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user_name: { type: String, required: true, trim: true },
  user_email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // Google-only accounts do not need a local password.
  user_password: { type: String, default: null, select: false },
  google_id: { type: String, unique: true, sparse: true, default: undefined },
  user_role: {
    type: String,
    enum: [
      "บุคลากรมหาลัย", "แอดมิน", "เจ้าหน้าที่",
      "เจ้าหน้าที่ถนนและทางเดิน",
      "เจ้าหน้าที่น้ำและท่อระบายน้ำ",
      "เจ้าหน้าที่อาคารและสถานที่",
      "เจ้าหน้าที่ไฟฟ้าและแสงสว่าง",
      "เจ้าหน้าที่อุบัติเหตุและความปลอดภัย"
    ],
    default: "บุคลากรมหาลัย"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
