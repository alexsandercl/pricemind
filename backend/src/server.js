require("dotenv").config();
const http = require('http');
const cors = require('cors');
const app = require("./app");
const connectDB = require("./config/database");
const { initSocket } = require('./socket');
const notificationsRoutes = require("./routes/notifications.routes");
const { initCronJobs } = require('./cron.jobs');

// SEGURANÇA
const security = require('./config/security');
const rateLimiter = require('./middlewares/rateLimiter');
const { sanitizeInput } = require('./middlewares/sanitizer');

const PORT = process.env.PORT || 5000;

// ROTAS E-COMMERCE - FASE 2
const shopifyRoutes = require('./routes/shopifyRoutes');
const woocommerceRoutes = require('./routes/woocommerceRoutes');

// ROTAS KIWIFY
const webhookRoutes = require('./routes/webhook.routes');

async function startServer() {
  await connectDB();

  // =============================================
  // 🔥 TRUST PROXY (RENDER/HEROKU/CLOUDFLARE)
  // =============================================
  // CRÍTICO: Sem isso, o rate limiter bloqueia TUDO!
  // O Render usa proxy reverso, então precisamos confiar no header X-Forwarded-For
  app.set('trust proxy', 1);
  console.log('🔧 Trust Proxy habilitado (necessário para Render)');

  // =============================================
  // MIDDLEWARES DE SEGURANÇA (ANTES DE TUDO)
  // =============================================
  
  // 1. Security Headers (Helmet)
  app.use(security.helmetMiddleware);
  
  // 2. CORS
  app.use(cors(security.corsOptions));
  
  // 3. Input Sanitization (anti-XSS)
  app.use(sanitizeInput);
  
  // 4. Rate Limiting (anti-DDoS)
  app.use('/api/', rateLimiter.apiLimiter);

  // =============================================
  // ROTAS DA APLICAÇÃO
  // =============================================
  
  // E-commerce integrations
  app.use('/shopify', shopifyRoutes);
  app.use('/woocommerce', woocommerceRoutes);
  
  // Notifications
  app.use("/api/notifications", notificationsRoutes);
  
  // Kiwify Webhooks
  app.use('/api/webhooks', webhookRoutes);
  
  // =============================================
  // SERVIDOR HTTP + WEBSOCKET
  // =============================================
  
  const server = http.createServer(app);
  const io = initSocket(server);
  app.set("io", io);

  // =============================================
  // INICIALIZAR CRON JOBS
  // =============================================
  
  initCronJobs();

  // =============================================
  // INICIAR SERVIDOR
  // =============================================
  
  server.listen(PORT, () => {
    console.log(`\n🚀 PriceMind API running on port ${PORT}`);
    console.log(`💬 WebSocket ativado para notificações em tempo real`);
    console.log(`🔗 Webhook Kiwify: ${process.env.BACKEND_URL || `http://localhost:${PORT}`}/api/webhooks/kiwify`);
    
    console.log('\n🔒 SECURITY CHECKLIST:');
    console.log('   ✅ Helmet (Security Headers)');
    console.log('   ✅ CORS (Restritivo)');
    console.log('   ✅ Rate Limiting (Anti-DDoS)');
    console.log('   ✅ Input Sanitization (Anti-XSS)');
    console.log('   ✅ Bcrypt (Senhas Seguras)');
    console.log('   ✅ JWT (Tokens Seguros)');
    console.log('   ✅ Trust Proxy (Render/Cloudflare)');
    
    console.log('\n🎉 Sistema pronto e seguro!\n');
  });
}

startServer();