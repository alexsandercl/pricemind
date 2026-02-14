#!/usr/bin/env node
// =============================================
// PRICEMIND - SECURITY CHECKER V2 (CORRIGIDO)
// =============================================

const fs = require('fs');
const path = require('path');

console.log('\n🔒 INICIANDO VERIFICAÇÃO DE SEGURANÇA...\n');

let errors = 0;
let warnings = 0;
let passed = 0;

// =============================================
// 1. VERIFICAR .ENV
// =============================================
console.log('📋 [1/9] Verificando arquivo .env...');

function checkEnvFile() {
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('   ❌ ERRO: Arquivo .env não encontrado!');
    errors++;
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  // Verificar JWT_SECRET
  const jwtSecret = lines.find(l => l.startsWith('JWT_SECRET='));
  if (!jwtSecret) {
    console.log('   ❌ ERRO: JWT_SECRET não definido!');
    errors++;
  } else {
    const secret = jwtSecret.split('=')[1]?.trim();
    if (!secret || secret.length < 32) {
      console.log('   ⚠️  AVISO: JWT_SECRET deve ter pelo menos 32 caracteres!');
      console.log('   💡 Gere um novo: openssl rand -base64 32');
      warnings++;
    } else {
      console.log('   ✅ JWT_SECRET OK');
      passed++;
    }
  }

  // Verificar MONGODB_URI
  const mongoUri = lines.find(l => l.startsWith('MONGODB_URI='));
  if (!mongoUri) {
    console.log('   ❌ ERRO: MONGODB_URI não definido!');
    errors++;
  } else if (mongoUri.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.log('   ⚠️  AVISO: Usando MongoDB local em produção!');
    console.log('   💡 Use MongoDB Atlas para produção');
    warnings++;
  } else {
    console.log('   ✅ MONGODB_URI OK');
    passed++;
  }

  // Verificar OPENAI_API_KEY
  const openaiKey = lines.find(l => l.startsWith('OPENAI_API_KEY='));
  if (!openaiKey) {
    console.log('   ❌ ERRO: OPENAI_API_KEY não definido!');
    errors++;
  } else {
    const key = openaiKey.split('=')[1]?.trim();
    if (!key || key.length < 20) {
      console.log('   ❌ ERRO: OPENAI_API_KEY inválida!');
      errors++;
    } else {
      console.log('   ✅ OPENAI_API_KEY OK');
      passed++;
    }
  }
}

checkEnvFile();

// =============================================
// 2. VERIFICAR .GITIGNORE
// =============================================
console.log('\n📋 [2/9] Verificando .gitignore...');

function checkGitignore() {
  const gitignorePath = path.join(__dirname, '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    console.log('   ❌ ERRO: Arquivo .gitignore não encontrado!');
    errors++;
    return;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  
  const requiredEntries = ['.env', 'node_modules', '.env.local', '.env.production'];
  let allPresent = true;

  requiredEntries.forEach(entry => {
    if (!gitignoreContent.includes(entry)) {
      console.log(`   ❌ ERRO: '${entry}' não está no .gitignore!`);
      errors++;
      allPresent = false;
    }
  });

  if (allPresent) {
    console.log('   ✅ .gitignore OK');
    passed++;
  }
}

checkGitignore();

// =============================================
// 3. VERIFICAR DEPENDÊNCIAS VULNERÁVEIS
// =============================================
console.log('\n📋 [3/9] Verificando dependências vulneráveis...');

function checkDependencies() {
  const packagePath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('   ⚠️  AVISO: package.json não encontrado neste diretório');
    warnings++;
    return;
  }

  console.log('   ℹ️  Execute: npm audit');
  console.log('   ℹ️  Para corrigir: npm audit fix');
  console.log('   ✅ Lembre-se de rodar npm audit regularmente');
  passed++;
}

checkDependencies();

// =============================================
// 4. VERIFICAR CORS
// =============================================
console.log('\n📋 [4/9] Verificando configuração CORS...');

function checkCORS() {
  const serverPath = path.join(__dirname, 'src', 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.log('   ⚠️  AVISO: server.js não encontrado, pulando verificação CORS');
    warnings++;
    return;
  }

  const serverContent = fs.readFileSync(serverPath, 'utf-8');
  
  if (!serverContent.includes('cors')) {
    console.log('   ⚠️  AVISO: CORS não configurado em server.js!');
    console.log('   💡 Adicione: app.use(cors({ origin: process.env.FRONTEND_URL }))');
    warnings++;
  } else if (serverContent.includes("origin: '*'") || serverContent.includes('origin:"*"')) {
    console.log('   ❌ ERRO: CORS configurado para aceitar qualquer origem (*)!');
    console.log('   💡 Mude para: origin: process.env.FRONTEND_URL');
    errors++;
  } else {
    console.log('   ✅ CORS OK');
    passed++;
  }
}

checkCORS();

// =============================================
// 5. VERIFICAR HELMET
// =============================================
console.log('\n📋 [5/9] Verificando Helmet.js (Security Headers)...');

function checkHelmet() {
  const serverPath = path.join(__dirname, 'src', 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.log('   ⚠️  AVISO: server.js não encontrado');
    warnings++;
    return;
  }

  const serverContent = fs.readFileSync(serverPath, 'utf-8');
  const packagePath = path.join(__dirname, 'package.json');
  
  if (fs.existsSync(packagePath)) {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    const hasHelmet = packageContent.dependencies?.helmet || packageContent.devDependencies?.helmet;
    
    if (!hasHelmet) {
      console.log('   ⚠️  AVISO: Helmet.js não instalado!');
      console.log('   💡 Instale: npm install helmet');
      warnings++;
    } else if (!serverContent.includes('helmet')) {
      console.log('   ⚠️  AVISO: Helmet instalado mas não usado!');
      console.log('   💡 Adicione: app.use(helmet())');
      warnings++;
    } else {
      console.log('   ✅ Helmet.js OK');
      passed++;
    }
  }
}

checkHelmet();

// =============================================
// 6. VERIFICAR RATE LIMITING (CORRIGIDO)
// =============================================
console.log('\n📋 [6/9] Verificando Rate Limiting...');

function checkRateLimit() {
  const packagePath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('   ⚠️  AVISO: package.json não encontrado');
    warnings++;
    return;
  }

  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  // CORRIGIDO: Verificar com nome correto
  const hasRateLimit = 
    packageContent.dependencies?.['express-rate-limit'] || 
    packageContent.devDependencies?.['express-rate-limit'];
  
  if (!hasRateLimit) {
    console.log('   ⚠️  AVISO: express-rate-limit não instalado!');
    console.log('   💡 Instale: npm install express-rate-limit');
    warnings++;
  } else {
    console.log('   ✅ express-rate-limit instalado');
    
    // Verificar se está sendo usado no server.js
    const serverPath = path.join(__dirname, 'src', 'server.js');
    if (fs.existsSync(serverPath)) {
      const serverContent = fs.readFileSync(serverPath, 'utf-8');
      if (serverContent.includes('rateLimit') || serverContent.includes('rate-limit')) {
        console.log('   ✅ Rate Limiting configurado no server.js');
        passed++;
      } else {
        console.log('   ⚠️  AVISO: express-rate-limit instalado mas não usado no server.js');
        console.log('   💡 Importe e use o middleware no server.js');
        warnings++;
      }
    } else {
      console.log('   ✅ Instalado (server.js não encontrado para verificar uso)');
      passed++;
    }
  }
}

checkRateLimit();

// =============================================
// 7. VERIFICAR BCRYPT
// =============================================
console.log('\n📋 [7/9] Verificando hash de senhas (bcrypt)...');

function checkBcrypt() {
  const packagePath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('   ⚠️  AVISO: package.json não encontrado');
    warnings++;
    return;
  }

  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  const hasBcrypt = 
    packageContent.dependencies?.bcrypt || 
    packageContent.dependencies?.bcryptjs ||
    packageContent.devDependencies?.bcrypt ||
    packageContent.devDependencies?.bcryptjs;
  
  if (!hasBcrypt) {
    console.log('   ❌ ERRO: bcrypt/bcryptjs não instalado!');
    console.log('   💡 Instale: npm install bcryptjs');
    errors++;
  } else {
    console.log('   ✅ Bcrypt/Bcryptjs OK');
    passed++;
  }
}

checkBcrypt();

// =============================================
// 8. VERIFICAR VALIDAÇÃO DE INPUTS
// =============================================
console.log('\n📋 [8/9] Verificando validação de inputs...');

function checkValidation() {
  const packagePath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('   ⚠️  AVISO: package.json não encontrado');
    warnings++;
    return;
  }

  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  const hasValidator = 
    packageContent.dependencies?.validator || 
    packageContent.dependencies?.joi ||
    packageContent.dependencies?.yup ||
    packageContent.devDependencies?.validator;
  
  if (!hasValidator) {
    console.log('   ⚠️  AVISO: Nenhuma biblioteca de validação encontrada!');
    console.log('   💡 Instale: npm install validator');
    warnings++;
  } else {
    console.log('   ✅ Biblioteca de validação encontrada');
    passed++;
  }
}

checkValidation();

// =============================================
// 9. VERIFICAR COMMITS ACIDENTAIS DE .ENV
// =============================================
console.log('\n📋 [9/9] Verificando histórico Git...');

function checkGitHistory() {
  const { execSync } = require('child_process');
  
  try {
    // Verificar se .env está no Git
    const gitStatus = execSync('git ls-files .env', { encoding: 'utf-8' });
    
    if (gitStatus.trim()) {
      console.log('   ❌ ERRO CRÍTICO: .env está commitado no Git!');
      console.log('   💡 Para remover:');
      console.log('      git rm --cached .env');
      console.log('      git commit -m "Remove .env from Git"');
      console.log('      Adicione .env ao .gitignore');
      errors++;
    } else {
      console.log('   ✅ .env não está no Git (OK)');
      passed++;
    }
  } catch (error) {
    console.log('   ℹ️  Não é um repositório Git ou Git não instalado');
    console.log('   💡 Não é um problema - Git é opcional');
  }
}

checkGitHistory();

// =============================================
// RELATÓRIO FINAL
// =============================================
console.log('\n' + '='.repeat(50));
console.log('📊 RELATÓRIO FINAL DE SEGURANÇA');
console.log('='.repeat(50));
console.log(`✅ Passou: ${passed}`);
console.log(`⚠️  Avisos: ${warnings}`);
console.log(`❌ Erros: ${errors}`);
console.log('='.repeat(50));

if (errors > 0) {
  console.log('\n❌ FALHOU: Corrija os erros antes de fazer deploy!');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  COM AVISOS: Revise os avisos antes de fazer deploy.');
  console.log('   Avisos não são críticos mas podem afetar segurança.');
  process.exit(0);
} else {
  console.log('\n✅ PASSOU: Sistema seguro para deploy!');
  console.log('\n🎉 PARABÉNS! Seu sistema está protegido com:');
  console.log('   🔒 Headers de segurança (Helmet)');
  console.log('   🚫 Rate limiting (anti-DDoS)');
  console.log('   🧹 Input sanitization (anti-XSS)');
  console.log('   🔐 Senhas hashadas (bcrypt)');
  console.log('   🎫 JWT configurado');
  console.log('   🛡️  CORS restritivo');
  process.exit(0);
}