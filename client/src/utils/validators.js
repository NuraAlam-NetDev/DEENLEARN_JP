import i18n from '../i18n/index.js';

// Same rules as the server (server/src/validators/auth.js), so users get instant feedback.
// The server still re-checks everything. Messages follow the selected language.
const t = (key, options) => i18n.t(key, options);
const EMAIL = /^\S+@\S+\.\S+$/;

function checkName(name) {
  const clean = name.trim();
  if (!clean) return t('validation.name.required');
  if (clean.length < 2) return t('validation.name.min', { n: 2 });
  if (clean.length > 100) return t('validation.name.max', { n: 100 });
  return '';
}

function checkEmail(email) {
  const value = email.trim();
  if (!value) return t('validation.email.required');
  if (!EMAIL.test(value)) return t('validation.email.invalid');
  return '';
}

// scope: 'password' (register) or 'newPassword' (change password). Returns '' when fine.
function checkPassword(password, scope = 'password') {
  if (!password) return t(`validation.${scope}.required`);
  if (password.length < 8) return t(`validation.${scope}.min`, { n: 8 });
  if (password.length > 72) return t(`validation.${scope}.max`, { n: 72 });
  if (!/[A-Za-z]/.test(password)) return t(`validation.${scope}.letter`);
  if (!/\d/.test(password)) return t(`validation.${scope}.number`);
  return '';
}

export function validateProfile({ name }) {
  const errors = {};
  const nameError = checkName(name);
  if (nameError) errors.name = nameError;
  return errors;
}

export function validatePasswordChange({ currentPassword, newPassword, confirmPassword }) {
  const errors = {};
  if (!currentPassword) errors.currentPassword = t('validation.currentPassword.required');

  const newError = checkPassword(newPassword, 'newPassword');
  if (newError) errors.newPassword = newError;
  else if (newPassword === currentPassword) errors.newPassword = t('validation.newPassword.sameAsCurrent');

  if (!confirmPassword) errors.confirmPassword = t('validation.confirmPassword.required');
  else if (confirmPassword !== newPassword) errors.confirmPassword = t('validation.confirmPassword.mismatch');
  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};
  const emailError = checkEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = t('validation.password.required');
  return errors;
}

export function validateRegister({ name, email, password }) {
  const errors = {};
  const nameError = checkName(name);
  if (nameError) errors.name = nameError;
  const emailError = checkEmail(email);
  if (emailError) errors.email = emailError;
  const passwordError = checkPassword(password);
  if (passwordError) errors.password = passwordError;
  return errors;
}