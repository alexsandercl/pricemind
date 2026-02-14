const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configuração do Multer para upload de avatar
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/avatars/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Apenas imagens são permitidas"));
  },
});

// Rotas de Profile
router.get("/", authMiddleware, profileController.getProfile);
router.put("/", authMiddleware, profileController.updateProfile);
router.put("/avatar", authMiddleware, upload.single("avatar"), profileController.updateAvatar);
router.delete("/avatar", authMiddleware, profileController.deleteAvatar);

// Rotas de Preferências
router.get("/preferences", authMiddleware, profileController.getPreferences);
router.put("/preferences", authMiddleware, profileController.updatePreferences);

// Rota de Alteração de Senha
router.put("/password", authMiddleware, profileController.changePassword);

module.exports = router;