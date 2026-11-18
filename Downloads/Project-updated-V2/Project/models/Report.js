const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cat_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  report_title: { type: String, required: true, trim: true },
  report_desc: { type: String, required: true, trim: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  tracking: [{
    status: { type: String, enum: ["pending", "in_progress", "resolved", "rejected"], required: true },
    note: { type: String, default: "" },
    images: { type: [String], default: [] },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updated_by_name: { type: String, default: "" },
    created_at: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ["pending", "in_progress", "resolved", "rejected"],
    default: "pending"
  }
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

module.exports = mongoose.model("Report", reportSchema);
