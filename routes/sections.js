const express = require('express');
const { body } = require('express-validator');
const {
  createSection,
  getSections,
  getSection,
  updateSection,
  deleteSection
} = require('../controllers/sectionController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const sectionValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Título é obrigatório e deve ter até 255 caracteres'),
  body('type')
    .isIn(['text', 'image', 'video', 'file', 'mixed'])
    .withMessage('Tipo deve ser: text, image, video, file ou mixed'),
  body('content')
    .notEmpty()
    .withMessage('Conteúdo é obrigatório'),
  body('is_reusable')
    .optional()
    .isBoolean()
    .withMessage('is_reusable deve ser um booleano')
];

router.use(authenticateToken);

router.post('/', sectionValidation, createSection);
router.get('/', getSections);
router.get('/:id', getSection);
router.put('/:id', sectionValidation, updateSection);
router.delete('/:id', deleteSection);

module.exports = router;