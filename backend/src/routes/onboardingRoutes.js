const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { saveOnboarding } = require("../controllers/onboarding.controller");

const router = express.Router();

// POST /api/onboarding
router.post("/", authMiddleware, saveOnboarding);

module.exports = router;