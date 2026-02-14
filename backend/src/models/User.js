const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      default: null
    },
    country: {
      type: String,
      default: 'BR'
    },
    termsAccepted: {
      type: Boolean,
      default: false
    },
    privacyAccepted: {
      type: Boolean,
      default: false
    },
    marketingAccepted: {
      type: Boolean,
      default: false
    },
    credits: {
      type: Number,
      default: 10
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'business'],
      default: 'free',
      set: function(value) {
        const normalized = String(value).toLowerCase().trim();
        const validPlans = ['free', 'starter', 'pro', 'business'];
        if (!validPlans.includes(normalized)) {
          console.warn(`⚠️ Plano inválido recebido: "${value}". Usando "free".`);
          return 'free';
        }
        return normalized;
      }
    },
    
    // ===== 🆕 CAMPOS KIWIFY =====
    planExpiry: {
      type: Date,
      default: null // null = plano free (sem expiração)
    },
    
    // Limites de uso mensal
    monthlyAnalysisCount: {
      type: Number,
      default: 0
    },
    
    monthlyAnalysisLimit: {
      type: Number,
      default: 10 // Free = 10, Starter = 50, Pro = 100, Business = 999999
    },
    
    lastResetDate: {
      type: Date,
      default: Date.now
    },
    
    // Dados Kiwify
    kiwifyCustomerId: {
      type: String,
      default: null,
      index: true
    },
    
    activeSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null
    },
    
    hasChargeback: {
      type: Boolean,
      default: false
    },
    // ===== FIM CAMPOS KIWIFY =====
    
    // CAMPOS ADMIN
    isAdmin: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'ceo'],
      default: 'user'
    },
    
    // CAMPOS PARA RESET DE SENHA
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ===== 🆕 MÉTODOS KIWIFY =====

// Verificar se plano está ativo
userSchema.methods.hasPlanAccess = function(requiredPlan) {
  const planHierarchy = { free: 0, starter: 1, pro: 2, business: 3 };
  const userLevel = planHierarchy[this.plan] || 0;
  const requiredLevel = planHierarchy[requiredPlan] || 0;
  
  // Verifica hierarquia e expiração
  if (userLevel < requiredLevel) return false;
  
  // Free nunca expira
  if (this.plan === 'free') return true;
  
  // Planos pagos verificam expiração
  if (this.planExpiry && new Date() > this.planExpiry) {
    return false;
  }
  
  return true;
};

// Verificar limite de análises
userSchema.methods.canMakeAnalysis = function() {
  // Reseta contador se passou 1 mês
  const lastReset = new Date(this.lastResetDate);
  const now = new Date();
  const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceReset >= 30) {
    this.monthlyAnalysisCount = 0;
    this.lastResetDate = now;
  }
  
  return this.monthlyAnalysisCount < this.monthlyAnalysisLimit;
};

// Incrementar contador de análises
userSchema.methods.incrementAnalysisCount = function() {
  this.monthlyAnalysisCount += 1;
};

// Ativar plano pago
userSchema.methods.activatePlan = function(plan, durationMonths = 1) {
  this.plan = plan;
  
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
  this.planExpiry = expiryDate;
  
  // Atualizar limites
  const limits = {
    free: 10,
    starter: 50,
    pro: 100,
    business: 999999
  };
  this.monthlyAnalysisLimit = limits[plan] || 10;
  
  // Reseta contador mensal
  this.monthlyAnalysisCount = 0;
  this.lastResetDate = new Date();
};

// Downgrade para free ao expirar
userSchema.methods.downgradeToFree = function() {
  this.plan = 'free';
  this.planExpiry = null;
  this.monthlyAnalysisLimit = 10;
  this.activeSubscriptionId = null;
};

// ===== FIM MÉTODOS KIWIFY =====

// Método para comparar senha
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);