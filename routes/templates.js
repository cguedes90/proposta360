const express = require('express');
const router = express.Router();
const TemplateController = require('../controllers/templateController');
const { authenticateToken } = require('../middleware/auth');

// Rotas públicas (sem autenticação)

// Listar todos os templates (público)
router.get('/', TemplateController.index);

// Buscar categorias disponíveis (público) - deve vir antes de /:id
router.get('/meta/categories', TemplateController.categories);

// Buscar por categoria (público) - deve vir antes de /:id
router.get('/category/:category', TemplateController.byCategory);

// Preview do template (público) - deve vir antes de /:id
router.get('/:templateId/preview', TemplateController.preview);

// Buscar template por ID (público) - deve vir por último
router.get('/:id', TemplateController.show);

// Rotas que requerem autenticação

// Templates recomendados para o usuário
router.get('/user/recommended', authenticateToken, TemplateController.recommended);

// Clonar template para proposta
router.post('/:templateId/clone', authenticateToken, TemplateController.clone);

// Avaliar template
router.post('/:templateId/rate', authenticateToken, TemplateController.rate);

// Estatísticas detalhadas do template
router.get('/:templateId/stats', authenticateToken, TemplateController.stats);

module.exports = router;