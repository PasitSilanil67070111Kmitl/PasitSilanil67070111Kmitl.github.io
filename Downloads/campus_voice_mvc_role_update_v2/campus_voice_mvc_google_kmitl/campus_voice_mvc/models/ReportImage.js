const mongoose = require("mongoose");

const reportImageSchema = new mongoose.Schema({
  report_id: { type: mongoose.Schema.Types.ObjectId, ref: "Report", required: true },
  image_url: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ReportImage", reportImageSchema);
