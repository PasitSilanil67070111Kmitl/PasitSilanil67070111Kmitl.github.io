const Category = require("../models/Category");

async function seedCategories() {
  const defaults = [
    ["ถนนและทางเดิน", "🛣️", "ถนนชำรุด ทางเท้าเสียหาย หรือทางเดินไม่ปลอดภัย"],
    ["ไฟฟ้าและแสงสว่าง", "💡", "ไฟดับ ไฟเสีย หรือไฟส่องสว่างไม่เพียงพอ"],
    ["น้ำและท่อระบายน้ำ", "💧", "น้ำท่วม ท่ออุดตัน หรือน้ำประปาขัดข้อง"],
    ["อุบัติเหตุและความปลอดภัย", "⚠️", "อุบัติเหตุหรือเหตุการณ์ที่อาจเป็นอันตราย"],
    ["อาคารและสถานที่", "🏢", "อุปกรณ์หรือพื้นที่ภายในอาคารชำรุด"],
    ["อื่น ๆ", "📌", "ปัญหาอื่นภายในมหาวิทยาลัย"]
  ];

  for (const [cat_name, cat_icon, cat_description] of defaults) {
    await Category.updateOne(
      { cat_name },
      { $setOnInsert: { cat_name, cat_icon, cat_description } },
      { upsert: true }
    );
  }
}

module.exports = seedCategories;
