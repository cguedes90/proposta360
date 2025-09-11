const express = require('express');
const { body } = require('express-validator');
const {
  createProposal,
  getProposals,
  getProposal,
  updateProposal,
  deleteProposal,
  addSectionToProposal,
  removeSectionFromProposal,
  reorderSections
} = require('../controllers/proposalController');
const { authenticateToken } = require('../middleware/auth');
const TrackingController = require('../controllers/trackingController');

const router = express.Router();

const proposalValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Título é obrigatório e deve ter até 255 caracteres'),
  body('private_title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Título privado deve ter até 255 caracteres'),
  body('content')
    .optional()
];

const proposalUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Título deve ter até 255 caracteres'),
  body('private_title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Título privado deve ter até 255 caracteres'),
  body('content')
    .optional(),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status deve ser draft, published ou archived')
];

const sectionOrderValidation = [
  body('sectionsOrder')
    .isArray()
    .withMessage('sectionsOrder deve ser um array'),
  body('sectionsOrder.*.sectionId')
    .isUUID()
    .withMessage('sectionId deve ser um UUID válido'),
  body('sectionsOrder.*.orderIndex')
    .isInt({ min: 0 })
    .withMessage('orderIndex deve ser um número inteiro não negativo')
];

// Rotas públicas (antes da autenticação)
router.post('/register-visitor', TrackingController.registerVisitor);
router.get('/public/:proposalId', async (req, res) => {
  try {
    const Proposal = require('../models/Proposal');
    const proposal = await Proposal.findByPublicLink(req.params.proposalId);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    res.json({ title: proposal.title, id: proposal.id });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.use(authenticateToken);

router.post('/', proposalValidation, createProposal);
router.get('/', getProposals);
router.get('/:id', getProposal);
router.put('/:id', proposalUpdateValidation, updateProposal);
router.delete('/:id', deleteProposal);

router.post('/:proposalId/sections', addSectionToProposal);
router.delete('/:proposalId/sections/:sectionId', removeSectionFromProposal);
router.put('/:proposalId/sections/reorder', sectionOrderValidation, reorderSections);

module.exports = router;