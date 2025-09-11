const express = require('express');
const { body } = require('express-validator');
const { 
  register, 
  login, 
  getProfile, 
  requestPasswordReset, 
  resetPassword, 
  checkProposalLimit 
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('plan')
    .optional()
    .isIn(['free', 'premium'])
    .withMessage('Plano deve ser "free" ou "premium"')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

const resetRequestValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Token é obrigatório'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
];

// Rotas de autenticação
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', authenticateToken, getProfile);

// Rotas de reset de senha
router.post('/request-password-reset', resetRequestValidation, requestPasswordReset);
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Rotas de planos e limites
router.get('/check-proposal-limit', authenticateToken, checkProposalLimit);

module.exports = router;