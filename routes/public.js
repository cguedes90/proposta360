const express = require('express');
const { body } = require('express-validator');
const {
  getPublicProposal,
  trackSectionView,
  trackInteraction
} = require('../controllers/publicController');

const router = express.Router();

const trackingValidation = [
  body('sectionId')
    .isUUID()
    .withMessage('sectionId deve ser um UUID válido'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('timeSpent deve ser um número inteiro não negativo')
];

const interactionValidation = [
  body('interactionType')
    .isIn(['click', 'scroll', 'download', 'approval', 'rejection'])
    .withMessage('Tipo de interação inválido'),
  body('sectionId')
    .optional()
    .isUUID()
    .withMessage('sectionId deve ser um UUID válido'),
  body('data')
    .optional()
    .isObject()
    .withMessage('data deve ser um objeto')
];

router.get('/proposal/:publicLink', getPublicProposal);
router.post('/proposal/:publicLink/track-section', trackingValidation, trackSectionView);
router.post('/proposal/:publicLink/track-interaction', interactionValidation, trackInteraction);

module.exports = router;