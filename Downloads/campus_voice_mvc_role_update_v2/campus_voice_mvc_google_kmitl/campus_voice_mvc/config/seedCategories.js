const Category = require("../models/Category");

async function seedCategories() {
  const defaults = [
    {
      cat_name: "ถนนและทางเดิน", cat_icon: "🛣️",
      cat_description: "ถนนชำรุด ทางเท้าเสียหาย หรือทางเดินไม่ปลอดภัย",
      contact_agency: "ฝ่ายโยธา สำนักงานเขต/เทศบาล หรือกรมทางหลวง/กรมทางหลวงชนบท (ถนนสายหลัก)",
      contact_channels: ["สายด่วน กทม. 1555", "Traffy Fondue", "กรมทางหลวง 1586"]
    },
    {
      cat_name: "ไฟฟ้าและแสงสว่าง", cat_icon: "💡",
      cat_description: "ไฟดับ ไฟเสีย หรือไฟส่องสว่างไม่เพียงพอ",
      contact_agency: "ฝ่ายโยธา/รักษาความสะอาด (ไฟสาธารณะ), การไฟฟ้านครหลวง/ส่วนภูมิภาค (ระบบไฟฟ้า), หรือบริษัทโทรคมนาคม (สายสื่อสาร)",
      contact_channels: ["Traffy Fondue", "MEA Call Center 1130", "PEA Call Center 1129"]
    },
    {
      cat_name: "น้ำและท่อระบายน้ำ", cat_icon: "💧",
      cat_description: "น้ำท่วม ท่ออุดตัน หรือน้ำประปาขัดข้อง",
      contact_agency: "สำนักการระบายน้ำ/ฝ่ายโยธาเขต หรือการประปานครหลวง/การประปาส่วนภูมิภาค (กรณีประปา)",
      contact_channels: ["สายด่วน กทม. 1555", "Traffy Fondue", "การประปานครหลวง 1125", "การประปาส่วนภูมิภาค 1662"]
    },
    {
      cat_name: "อุบัติเหตุและความปลอดภัย", cat_icon: "⚠️",
      cat_description: "อุบัติเหตุหรือเหตุการณ์ที่อาจเป็นอันตราย",
      contact_agency: "ฝ่ายเทศกิจ/ฝ่ายการจราจร/ฝ่ายรักษาความสะอาดฯ หรือสถานีตำรวจท้องที่",
      contact_channels: ["Traffy Fondue", "สายด่วน กทม. 1555", "สถานีตำรวจในพื้นที่ (กรณีเร่งด่วน)"]
    },
    {
      cat_name: "อาคารและสถานที่", cat_icon: "🏢",
      cat_description: "อุปกรณ์หรือพื้นที่ภายในอาคารชำรุด",
      contact_agency: "ฝ่ายโยธาและฝ่ายเทศกิจ สำนักงานเขตหรือเทศบาลในพื้นที่",
      contact_channels: ["สำนักงานเขต/เทศบาลท้องถิ่นโดยตรง", "Traffy Fondue"]
    }
  ];

  for (const category of defaults) {
    await Category.updateOne(
      { cat_name: category.cat_name },
      { $set: category },
      { upsert: true }
    );
  }

  // หมวดอื่น ๆ ถูกถอดออกจากระบบตามขอบเขตงาน
  await Category.deleteOne({ cat_name: "อื่น ๆ" });
}

module.exports = seedCategories;
