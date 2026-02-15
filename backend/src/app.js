const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");
const profileRoutes = require("./routes/profileRoutes"); 
const preferencesRoutes = require("./routes/preferencesroutes");
const statsRoutes = require("./routes/statsRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const premiumRoutes = require("./routes/premiumRoutes")
const adminRoutes = require("./routes/adminRoutes");
const reportsRoutes = require('./routes/reportsRoutes');
const batchRoutes = require('./routes/batchRoutes');
const monitorRoutes = require('./routes/monitorRoutes');
const trafficRoiRoutes = require("./routes/trafficRoiRoutes");
const checkoutRoutes = require("./routes/checkout.routes");
const supportRoutes = require("./routes/supportRoutes");

// 🆕 NOVAS ROTAS PRO
const breakEvenRoutes = require("./routes/breakEvenRoutes");
const discountSimulatorRoutes = require("./routes/discountSimulatorRoutes");

const { initCronJobs } = require('./cron.jobs');

const app = express();

/* =========================
   MIDDLEWARES
========================= */

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS CONFIGURADO CORRETAMENTE
app.use(
  cors({
    origin: "http://localhost:5173", // porta do seu Vite/React
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/* =========================
   STATIC UPLOADS COM HEADERS CORS
========================= */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    setHeaders: (res, filePath) => {
      // Headers CORS para imagens
      res.set("Access-Control-Allow-Origin", "http://localhost:5173");
      res.set("Access-Control-Allow-Credentials", "true");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");

      // Sem cache para avatars
      if (filePath.includes("avatars")) {
        res.set("Cache-Control", "public, max-age=0");
      }
    },
  })
);

/* =========================
   ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/monitor', monitorRoutes);
app.use("/api/traffic-roi", trafficRoiRoutes);
app.use("/api/support", supportRoutes);

// 🆕 NOVAS ROTAS PRO
app.use("/api/break-even", breakEvenRoutes);
app.use("/api/discount-simulator", discountSimulatorRoutes);

app.use("/api/checkout", checkoutRoutes);
/* =========================
   HEALTH
========================= */

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "PriceMind API running",
  });
});

initCronJobs();

module.exports = app;