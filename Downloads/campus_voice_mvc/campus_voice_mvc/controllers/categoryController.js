const Category = require("../models/Category");

async function getCategories(_req, res) {
  try {
    const categories = await Category.find().sort({ cat_name: 1 });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = { getCategories };
