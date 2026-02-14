/**
 * Valida força da senha
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }

  // 🔥 NÃO EXIGE MAIS CARACTERE ESPECIAL

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculateStrength(password)
  };
}

function calculateStrength(password) {
  let strength = 0;

  if (password.length >= 8) strength += 30;
  if (password.length >= 12) strength += 20;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 5;

  if (strength <= 50) return 'weak';
  if (strength <= 75) return 'medium';
  return 'strong';
}

module.exports = { validatePasswordStrength };
