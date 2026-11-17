const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cat_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  report_title: { type: String, required: true, trim: true },
  report_desc: { type: String, required: true, trim: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "in_progress", "resolved", "rejected"],
    default: "pending"
  }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

module.exports = mongoose.model("Report", reportSchema);
