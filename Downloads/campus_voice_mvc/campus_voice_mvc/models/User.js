const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user_name: { type: String, required: true, trim: true },
  user_email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  user_password: { type: String, required: true },
  user_role: {
    type: String,
    enum: ["บุคลากรมหาลัย", "แอดมิน", "เจ้าหน้าที่"],
    default: "บุคลากรมหาลัย"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
