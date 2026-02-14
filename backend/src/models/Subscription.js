const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubscriptionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'business'],
    required: true,
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    required: true,
    default: 'pending'
  },
  
  // Dados do Kiwify
  kiwifyOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  kiwifyProductId: {
    type: String,
    required: true
  },
  kiwifyCustomerId: {
    type: String,
    required: true
  },
  
  // Financeiro
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'BRL'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  
  // Datas
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  nextBillingDate: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  
  // Webhook
  webhookData: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Índices para performance
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ kiwifyOrderId: 1 });
SubscriptionSchema.index({ endDate: 1 });

// Método para verificar se assinatura está ativa
SubscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && new Date() < this.endDate;
};

// Método para renovar assinatura
SubscriptionSchema.methods.renew = function(months = 1) {
  const newEndDate = new Date(this.endDate);
  newEndDate.setMonth(newEndDate.getMonth() + months);
  this.endDate = newEndDate;
  this.nextBillingDate = newEndDate;
  this.status = 'active';
};

// Método para cancelar assinatura
SubscriptionSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);