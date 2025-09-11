const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  requireSuperAdmin,
  getDashboardStats,
  getAllUsers,
  updateUserPlan,
  updateUserRole,
  getAllLeads,
  updateLeadStatus,
  deleteUser,
  deleteLead,
  convertLeadToUser
} = require('../controllers/adminController');

const router = express.Router();

// Middleware: todas as rotas requerem autenticação e super admin
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Validações
const updatePlanValidation = [
  body('plan')
    .isIn(['free', 'premium'])
    .withMessage('Plano deve ser "free" ou "premium"')
];

const updateRoleValidation = [
  body('role')
    .isIn(['user', 'admin', 'super_admin'])
    .withMessage('Role deve ser "user", "admin" ou "super_admin"')
];

const updateLeadStatusValidation = [
  body('status')
    .isIn(['pending', 'contacted', 'converted', 'lost'])
    .withMessage('Status deve ser "pending", "contacted", "converted" ou "lost"'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notas devem ter no máximo 1000 caracteres')
];

const convertLeadValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('plan')
    .optional()
    .isIn(['free', 'premium'])
    .withMessage('Plano deve ser "free" ou "premium"')
];

// Rotas do dashboard
router.get('/stats', getDashboardStats);

// Rotas de usuários
router.get('/users', getAllUsers);
router.put('/users/:userId/plan', updatePlanValidation, updateUserPlan);
router.put('/users/:userId/role', updateRoleValidation, updateUserRole);
router.delete('/users/:userId', deleteUser);

// Rotas de leads
router.get('/leads', getAllLeads);
router.put('/leads/:leadId/status', updateLeadStatusValidation, updateLeadStatus);
router.post('/leads/:leadId/convert', convertLeadValidation, convertLeadToUser);
router.delete('/leads/:leadId', deleteLead);

module.exports = router;