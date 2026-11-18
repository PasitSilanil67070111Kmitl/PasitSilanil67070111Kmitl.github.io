const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  cat_name: { type: String, required: true, unique: true },
  cat_icon: { type: String, default: "📌" },
  cat_description: { type: String, default: "" },
  contact_agency: { type: String, default: "" },
  contact_channels: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
