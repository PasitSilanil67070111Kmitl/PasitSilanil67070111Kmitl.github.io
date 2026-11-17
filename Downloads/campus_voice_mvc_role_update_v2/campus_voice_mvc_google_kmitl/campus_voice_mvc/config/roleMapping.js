const roleCategoryMap = {
  "เจ้าหน้าที่ถนนและทางเดิน": "ถนนและทางเดิน",
  "เจ้าหน้าที่น้ำและท่อระบายน้ำ": "น้ำและท่อระบายน้ำ",
  "เจ้าหน้าที่อาคารและสถานที่": "อาคารและสถานที่",
  "เจ้าหน้าที่ไฟฟ้าและแสงสว่าง": "ไฟฟ้าและแสงสว่าง",
  "เจ้าหน้าที่อุบัติเหตุและความปลอดภัย": "อุบัติเหตุและความปลอดภัย"
};

const categoryRoles = Object.keys(roleCategoryMap);
const allStaffRoles = ["แอดมิน", "ผู้ดูแลระบบ", "เจ้าหน้าที่", ...categoryRoles];

function categoryForRole(role) {
  return roleCategoryMap[role] || null;
}

module.exports = { roleCategoryMap, categoryRoles, allStaffRoles, categoryForRole };
