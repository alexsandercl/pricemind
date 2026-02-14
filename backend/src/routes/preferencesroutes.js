const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getPreferences,
  updatePreferences
} = require("../controllers/preferences.controller");

const router = express.Router();

router.get("/", authMiddleware, getPreferences);
router.put("/", authMiddleware, updatePreferences);

module.exports = router;