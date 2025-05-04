// backend/routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const { getCategories } = require("../controllers/pollController");

// ✅ Route to get categories
router.get("/", getCategories);

module.exports = router;
