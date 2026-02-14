// =============================================
// INPUT SANITIZATION MIDDLEWARE
// =============================================
// Previne SQL Injection, XSS, e outros ataques
// Limpa e valida todos os inputs do usuário
//
// USO:
// const { sanitizeInput, validateEmail } = require('./middlewares/sanitizer');
// app.use(sanitizeInput);
// =============================================

const validator = require('validator');
const xss = require('xss');

// =============================================
// 1. SANITIZAR TODOS OS INPUTS
// =============================================
// Remove caracteres perigosos de req.body, req.params, req.query
const sanitizeInput = (req, res, next) => {
  // Sanitizar req.body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitizar req.params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  // Sanitizar req.query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// =============================================
// 2. SANITIZAR OBJETO RECURSIVAMENTE
// =============================================
function sanitizeObject(obj) {
  const sanitized = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      // Se for string, sanitiza
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      }
      // Se for objeto, recursão
      else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value);
      }
      // Se for array, sanitiza cada item
      else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => {
          if (typeof item === 'string') return sanitizeString(item);
          if (typeof item === 'object') return sanitizeObject(item);
          return item;
        });
      }
      // Outros tipos passam direto (number, boolean, null)
      else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

// =============================================
// 3. SANITIZAR STRING
// =============================================
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return str;

  // 1. Trim espaços
  let sanitized = str.trim();

  // 2. Remover XSS (scripts, iframes, etc)
  sanitized = xss(sanitized, {
    whiteList: {}, // Não permite nenhuma tag HTML
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style']
  });

  // 3. Escapar caracteres especiais HTML
  sanitized = validator.escape(sanitized);

  // 4. Remover caracteres de controle (null bytes, etc)
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // 5. Limitar tamanho (previne DoS)
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  return sanitized;
}

// =============================================
// 4. VALIDAR EMAIL
// =============================================
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email é obrigatório' };
  }

  // Trim e lowercase
  email = email.trim().toLowerCase();

  // Validar formato
  if (!validator.isEmail(email)) {
    return { valid: false, error: 'Email inválido' };
  }

  // Validar tamanho
  if (email.length > 255) {
    return { valid: false, error: 'Email muito longo' };
  }

  // Bloquear emails temporários/descartáveis (opcional)
  const disposableDomains = [
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'trashmail.com'
  ];

  const domain = email.split('@')[1];
  if (disposableDomains.includes(domain)) {
    return { valid: false, error: 'Emails temporários não são permitidos' };
  }

  return { valid: true, email };
};

// =============================================
// 5. VALIDAR SENHA
// =============================================
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Senha é obrigatória' };
  }

  // Mínimo 6 caracteres
  if (password.length < 6) {
    return { valid: false, error: 'Senha deve ter no mínimo 6 caracteres' };
  }

  // Máximo 128 caracteres (previne DoS)
  if (password.length > 128) {
    return { valid: false, error: 'Senha muito longa' };
  }

  // Opcional: Validar complexidade
  // const hasUppercase = /[A-Z]/.test(password);
  // const hasLowercase = /[a-z]/.test(password);
  // const hasNumber = /[0-9]/.test(password);
  // const hasSpecial = /[!@#$%^&*]/.test(password);

  // if (!hasUppercase || !hasLowercase || !hasNumber) {
  //   return { 
  //     valid: false, 
  //     error: 'Senha deve conter maiúsculas, minúsculas e números' 
  //   };
  // }

  return { valid: true };
};

// =============================================
// 6. VALIDAR URL
// =============================================
const validateURL = (url) => {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL é obrigatória' };
  }

  url = url.trim();

  // Validar formato
  if (!validator.isURL(url, { 
    protocols: ['http', 'https'],
    require_protocol: true 
  })) {
    return { valid: false, error: 'URL inválida' };
  }

  // Bloquear URLs locais/privadas (previne SSRF)
  const forbiddenPatterns = [
    /localhost/i,
    /127\.0\.0\.1/,
    /192\.168\./,
    /10\./,
    /172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /0\.0\.0\.0/,
    /file:\/\//i
  ];

  if (forbiddenPatterns.some(pattern => pattern.test(url))) {
    return { valid: false, error: 'URL não permitida' };
  }

  return { valid: true, url };
};

// =============================================
// 7. VALIDAR NÚMERO
// =============================================
const validateNumber = (value, options = {}) => {
  const { 
    min = -Infinity, 
    max = Infinity, 
    integer = false 
  } = options;

  // Converter para número
  const num = parseFloat(value);

  // Validar se é número
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: 'Valor deve ser um número válido' };
  }

  // Validar se é inteiro (se exigido)
  if (integer && !Number.isInteger(num)) {
    return { valid: false, error: 'Valor deve ser um número inteiro' };
  }

  // Validar mínimo
  if (num < min) {
    return { valid: false, error: `Valor deve ser no mínimo ${min}` };
  }

  // Validar máximo
  if (num > max) {
    return { valid: false, error: `Valor deve ser no máximo ${max}` };
  }

  return { valid: true, value: num };
};

// =============================================
// 8. VALIDAR PREÇO
// =============================================
const validatePrice = (price) => {
  const result = validateNumber(price, { min: 0, max: 999999.99 });
  
  if (!result.valid) {
    return result;
  }

  // Validar precisão (máximo 2 casas decimais)
  const [, decimals] = price.toString().split('.');
  if (decimals && decimals.length > 2) {
    return { valid: false, error: 'Preço deve ter no máximo 2 casas decimais' };
  }

  return { valid: true, value: result.value };
};

// =============================================
// 9. VALIDAR PERCENTUAL
// =============================================
const validatePercentage = (percentage) => {
  return validateNumber(percentage, { min: 0, max: 100 });
};

// =============================================
// 10. VALIDAR UPLOAD DE ARQUIVO
// =============================================
const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB padrão
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  } = options;

  if (!file) {
    return { valid: false, error: 'Nenhum arquivo enviado' };
  }

  // Validar tamanho
  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(2);
    return { 
      valid: false, 
      error: `Arquivo muito grande. Máximo: ${maxMB}MB` 
    };
  }

  // Validar tipo
  if (!allowedTypes.includes(file.mimetype)) {
    return { 
      valid: false, 
      error: `Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(', ')}` 
    };
  }

  // Validar nome do arquivo (remover caracteres perigosos)
  const safeName = file.originalname
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);

  return { 
    valid: true, 
    file: {
      ...file,
      safeName
    }
  };
};

// =============================================
// 11. MIDDLEWARE DE VALIDAÇÃO POR ROTA
// =============================================
// Exemplo: validateBody(['email', 'password'])
const validateBody = (requiredFields) => {
  return (req, res, next) => {
    const errors = [];

    requiredFields.forEach(field => {
      if (!req.body[field]) {
        errors.push(`Campo '${field}' é obrigatório`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validação falhou',
        details: errors
      });
    }

    next();
  };
};

// =============================================
// EXPORTAR TODAS AS FUNÇÕES
// =============================================
module.exports = {
  sanitizeInput,           // Middleware geral
  sanitizeString,          // Função helper
  validateEmail,
  validatePassword,
  validateURL,
  validateNumber,
  validatePrice,
  validatePercentage,
  validateFileUpload,
  validateBody             // Middleware específico
};

// =============================================
// EXEMPLO DE USO NO SERVER.JS:
// =============================================
/*
const { 
  sanitizeInput, 
  validateEmail, 
  validatePassword 
} = require('./middlewares/sanitizer');

// Aplicar sanitização global
app.use(sanitizeInput);

// Em um controller:
const register = async (req, res) => {
  const { email, password } = req.body;

  // Validar email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ error: emailValidation.error });
  }

  // Validar senha
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ error: passwordValidation.error });
  }

  // Continuar com registro...
};
*/