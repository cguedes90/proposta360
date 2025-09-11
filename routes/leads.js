const express = require('express');
const { body } = require('express-validator');
const { createContactLead, createRegistrationLead } = require('../controllers/leadController');

const router = express.Router();

const contactLeadValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido'),
  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone deve estar no formato brasileiro'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nome da empresa deve ter no máximo 255 caracteres'),
  body('subject')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Assunto deve ter entre 2 e 255 caracteres'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Mensagem deve ter entre 10 e 2000 caracteres')
];

const registrationLeadValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido'),
  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone deve estar no formato brasileiro'),
  body('whatsapp')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('WhatsApp deve estar no formato brasileiro'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Nome da empresa deve ter no máximo 255 caracteres'),
  body('cnpj')
    .optional()
    .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .withMessage('CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'),
  body('cpf')
    .optional()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    .withMessage('CPF deve estar no formato XXX.XXX.XXX-XX'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Endereço deve ter no máximo 500 caracteres'),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Cidade deve ter no máximo 255 caracteres'),
  body('state')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('Estado deve ter 2 caracteres'),
  body('cep')
    .optional()
    .matches(/^\d{5}-\d{3}$/)
    .withMessage('CEP deve estar no formato XXXXX-XXX'),
  body('plan_interest')
    .optional()
    .isIn(['free', 'premium'])
    .withMessage('Plano de interesse deve ser "free" ou "premium"')
];

// Rotas públicas
router.post('/contact', contactLeadValidation, createContactLead);
router.post('/registration', registrationLeadValidation, createRegistrationLead);

module.exports = router;