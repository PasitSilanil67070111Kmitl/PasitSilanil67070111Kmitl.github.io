const mongoose = require("mongoose");
const Report = require("../models/Report");
const ReportImage = require("../models/ReportImage");

async function createReport(req, res) {
  try {
    const { cat_id, report_title, report_desc, latitude, longitude } = req.body;
    if (!cat_id || !report_title || !report_desc || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลและตำแหน่งให้ครบ" });
    }
    if (!mongoose.Types.ObjectId.isValid(cat_id)) {
      return res.status(400).json({ message: "ประเภทปัญหาไม่ถูกต้อง" });
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "พิกัดไม่ถูกต้อง" });
    }

    const report = await Report.create({
      user_id: req.auth.id,
      cat_id,
      report_title,
      report_desc,
      latitude: lat,
      longitude: lng
    });
    return res.status(201).json({ message: "ส่งเรื่องแจ้งปัญหาแล้ว", report });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function getMyReports(req, res) {
  try {
    const reports = await Report.find({ user_id: req.auth.id })
      .populate("cat_id", "cat_name cat_icon")
      .sort({ created_at: -1 });
    const ids = reports.map(report => report._id);
    const images = await ReportImage.find({ report_id: { $in: ids } });
    return res.json(reports.map(report => ({
      ...report.toObject(),
      images: images.filter(image => String(image.report_id) === String(report._id))
    })));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getReports(_req, res) {
  try {
    const reports = await Report.find()
      .populate("cat_id", "cat_name cat_icon")
      .populate("user_id", "user_name")
      .sort({ created_at: -1 });
    const ids = reports.map(report => report._id);
    const images = await ReportImage.find({ report_id: { $in: ids } });
    return res.json(reports.map(report => ({
      ...report.toObject(),
      images: images.filter(image => String(image.report_id) === String(report._id))
    })));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getReportById(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "รหัสรายการไม่ถูกต้อง" });
    }
    const report = await Report.findById(req.params.id)
      .populate("cat_id", "cat_name cat_icon")
      .populate("user_id", "user_name");
    if (!report) return res.status(404).json({ message: "ไม่พบรายการแจ้งปัญหา" });

    const images = await ReportImage.find({ report_id: report._id });
    return res.json({ ...report.toObject(), images });
  } catch (error) {
    return res.status(400).json({ message: "รหัสรายการไม่ถูกต้อง" });
  }
}

async function updateStatus(req, res) {
  try {
    const allowed = ["pending", "in_progress", "resolved", "rejected"];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: "สถานะไม่ถูกต้อง" });
    }
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!report) return res.status(404).json({ message: "ไม่พบรายการแจ้งปัญหา" });
    return res.json({ message: "อัปเดตสถานะแล้ว", report });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function deleteReport(req, res) {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: "ไม่พบรายการแจ้งปัญหา" });
    await ReportImage.deleteMany({ report_id: report._id });
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function addImages(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "ไม่พบรายการแจ้งปัญหา" });

    const isOwner = String(report.user_id) === req.auth.id;
    const isStaff = ["แอดมิน", "เจ้าหน้าที่"].includes(req.auth.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เพิ่มรูปในรายการนี้" });
    }

    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: "กรุณาเลือกรูปภาพ" });

    const docs = await ReportImage.insertMany(files.map(file => ({
      report_id: report._id,
      image_url: `/uploads/${file.filename}`
    })));
    return res.status(201).json({ message: "อัปโหลดรูปภาพสำเร็จ", images: docs });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

module.exports = {
  createReport, getMyReports, getReports, getReportById,
  updateStatus, deleteReport, addImages
};
