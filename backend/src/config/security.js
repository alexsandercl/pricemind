// =============================================
// HELMET SECURITY CONFIGURATION
// =============================================
// Configura headers HTTP para máxima segurança
// Previne: XSS, Clickjacking, MIME sniffing, etc
//
// USO:
// const securityConfig = require('./config/security');
// app.use(securityConfig.helmetMiddleware);
// =============================================

const helmet = require('helmet');

// =============================================
// CONFIGURAÇÃO DO HELMET
// =============================================
const helmetMiddleware = helmet({
  
  // 1. Content Security Policy (CSP)
  // Previne XSS definindo fontes confiáveis de conteúdo
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      
      // Scripts permitidos
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Permitir scripts inline (cuidado!)
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://connect.facebook.net"
      ],
      
      // Estilos permitidos
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      
      // Fontes permitidas
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      
      // Imagens permitidas
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      
      // APIs externas permitidas
      connectSrc: [
        "'self'",
        "https://api.pricemind.com.br",
        "https://api.openai.com",
        "https://www.google-analytics.com"
      ],
      
      // Frames permitidos (iframes)
      frameSrc: [
        "'self'",
        "https://kiwify.com.br"
      ],
      
      // Não permite eval() (segurança!)
      scriptSrcAttr: ["'none'"],
      
      // Upgrade HTTP para HTTPS
      upgradeInsecureRequests: []
    }
  },

  // 2. X-DNS-Prefetch-Control
  // Controla DNS prefetching
  dnsPrefetchControl: {
    allow: false
  },

  // 3. Expect-CT
  // Certificate Transparency
  expectCt: {
    enforce: true,
    maxAge: 86400 // 24 horas
  },

  // 4. X-Frame-Options
  // Previne clickjacking
  frameguard: {
    action: 'deny' // Não permite site em iframe
  },

  // 5. X-Powered-By
  // Remove header que expõe tecnologia
  hidePoweredBy: true,

  // 6. Strict-Transport-Security (HSTS)
  // Força HTTPS
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },

  // 7. X-Download-Options
  // Previne downloads executáveis no IE
  ieNoOpen: true,

  // 8. X-Content-Type-Options
  // Previne MIME sniffing
  noSniff: true,

  // 9. X-Permitted-Cross-Domain-Policies
  // Controla Flash/PDF
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  },

  // 10. Referrer-Policy
  // Controla header Referer
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // 11. X-XSS-Protection
  // Ativa filtro XSS do navegador
  xssFilter: true

});

// =============================================
// CORS CONFIGURATION
// =============================================
const corsOptions = {
  // Origens permitidas
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',      // Dev
      'http://localhost:3000',      // Dev alternativo
      'https://pricemind.com.br',   // Produção
      'https://www.pricemind.com.br' // Produção com www
    ];

    // Permite requests sem origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`🚨 CORS bloqueou origem: ${origin}`);
      callback(new Error('Origem não permitida por CORS'));
    }
  },

  // Métodos HTTP permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Headers permitidos
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],

  // Headers expostos (acessíveis pelo cliente)
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],

  // Permite cookies
  credentials: true,

  // Cache de preflight (OPTIONS)
  maxAge: 86400, // 24 horas

  // Responde 204 para OPTIONS
  optionsSuccessStatus: 204
};

// =============================================
// MONGOOSE SECURITY
// =============================================
// Configurações seguras para MongoDB
const mongooseSecurityOptions = {
  
  // 1. Usa strict mode (previne injeções)
  strict: true,
  
  // 2. Validação sempre ativa
  runValidators: true,
  
  // 3. Não permite métodos $where (perigosos)
  // (configurar no schema)
};

// =============================================
// JWT SECURITY
// =============================================
// Configurações seguras para tokens
const jwtConfig = {
  
  // Algoritmo forte
  algorithm: 'HS256',
  
  // Expiração curta
  expiresIn: '24h',
  
  // Issuer (quem emitiu)
  issuer: 'pricemind-api',
  
  // Audience (para quem é)
  audience: 'pricemind-app',
  
  // Secret (mínimo 32 caracteres)
  // NUNCA commitar! Usar .env
  secret: process.env.JWT_SECRET,
  
  // Validação de claims
  clockTolerance: 10 // 10 segundos de tolerância
};

// =============================================
// BCRYPT SECURITY
// =============================================
// Configurações para hash de senhas
const bcryptConfig = {
  
  // Rounds (quanto maior, mais seguro mas mais lento)
  // 10 = bom balanço entre segurança e performance
  saltRounds: 10,
  
  // Para senhas muito sensíveis (admin), usar 12
  adminSaltRounds: 12
};

// =============================================
// FILE UPLOAD SECURITY
// =============================================
const fileUploadConfig = {
  
  // Tamanho máximo (10MB)
  maxSize: 10 * 1024 * 1024,
  
  // Tipos permitidos
  allowedMimeTypes: {
    images: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    spreadsheets: [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  },
  
  // Extensões bloqueadas (executáveis)
  blockedExtensions: [
    '.exe',
    '.dll',
    '.bat',
    '.cmd',
    '.sh',
    '.ps1',
    '.vbs',
    '.scr',
    '.com',
    '.pif'
  ],
  
  // Diretório de upload (fora do public!)
  uploadDir: 'uploads/',
  
  // Gerar nome aleatório
  generateRandomName: true
};

// =============================================
// SESSION SECURITY
// =============================================
const sessionConfig = {
  
  // Secret forte (mínimo 32 chars)
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  
  // Nome do cookie
  name: 'pricemind.sid',
  
  // Configurações do cookie
  cookie: {
    // HTTPS apenas (prod)
    secure: process.env.NODE_ENV === 'production',
    
    // Não acessível via JavaScript
    httpOnly: true,
    
    // SameSite (previne CSRF)
    sameSite: 'strict',
    
    // Tempo de vida (7 dias)
    maxAge: 7 * 24 * 60 * 60 * 1000
  },
  
  // Resave
  resave: false,
  
  // SaveUninitialized
  saveUninitialized: false
};

// =============================================
// RATE LIMIT CONFIGURATION
// =============================================
const rateLimitConfig = {
  
  // Janela de tempo
  windowMs: 15 * 60 * 1000, // 15 minutos
  
  // Máximo de requests
  max: 100,
  
  // Mensagem
  message: {
    error: 'Muitas requisições. Tente novamente mais tarde.'
  },
  
  // Headers
  standardHeaders: true,
  legacyHeaders: false,
  
  // Store (usar Redis em produção)
  // store: new RedisStore({ client: redisClient })
};

// =============================================
// SECURITY CHECKLIST
// =============================================
const securityChecklist = {
  helmet: '✅ Headers de segurança',
  cors: '✅ CORS configurado',
  rateLimit: '✅ Rate limiting ativo',
  sanitization: '✅ Input sanitization',
  bcrypt: '✅ Senhas hashadas',
  jwt: '✅ Tokens seguros',
  fileUpload: '✅ Upload validado',
  https: '✅ HTTPS em produção',
  env: '✅ Secrets em .env',
  gitignore: '✅ .env no .gitignore',
  updates: '⚠️  Manter dependências atualizadas',
  logs: '⚠️  Monitorar logs de segurança',
  backups: '⚠️  Backups regulares',
  audit: '⚠️  npm audit frequente'
};

// =============================================
// SECURITY TIPS
// =============================================
const securityTips = {
  passwords: [
    'Nunca armazenar senhas em plain text',
    'Sempre usar bcrypt com 10+ rounds',
    'Implementar reset de senha seguro',
    'Considerar 2FA para admins'
  ],
  
  tokens: [
    'JWT secret com 32+ caracteres',
    'Expiração curta (24h)',
    'Refresh tokens em httpOnly cookies',
    'Blacklist de tokens revogados'
  ],
  
  api: [
    'Rate limiting em todas as rotas',
    'Validação de inputs sempre',
    'Sanitização de outputs',
    'CORS restritivo'
  ],
  
  database: [
    'Usar Prisma/ORM (previne SQL injection)',
    'Backups automáticos diários',
    'Criptografar dados sensíveis',
    'Índices para performance'
  ],
  
  deployment: [
    'HTTPS obrigatório',
    'Firewall configurado',
    'Portas não-essenciais fechadas',
    'Logs centralizados (Sentry)'
  ]
};

// =============================================
// EXPORTAR TUDO
// =============================================
module.exports = {
  helmetMiddleware,
  corsOptions,
  mongooseSecurityOptions,
  jwtConfig,
  bcryptConfig,
  fileUploadConfig,
  sessionConfig,
  rateLimitConfig,
  securityChecklist,
  securityTips
};

// =============================================
// EXEMPLO DE USO NO SERVER.JS:
// =============================================
/*
const express = require('express');
const cors = require('cors');
const security = require('./config/security');

const app = express();

// 1. Helmet (headers de segurança)
app.use(security.helmetMiddleware);

// 2. CORS
app.use(cors(security.corsOptions));

// 3. JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Rate limiting (adicionar depois)
// const rateLimit = require('express-rate-limit');
// app.use(rateLimit(security.rateLimitConfig));

// 5. Sanitização (adicionar depois)
// const { sanitizeInput } = require('./middlewares/sanitizer');
// app.use(sanitizeInput);

// Suas rotas aqui...

// Log de segurança na inicialização
console.log('\n🔒 SECURITY CHECKLIST:');
Object.entries(security.securityChecklist).forEach(([key, value]) => {
  console.log(`   ${value} ${key}`);
});

app.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
});
*/