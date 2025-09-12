const express = require('express');
const router = express.Router();
const TemplateController = require('../controllers/templateController');
const { authenticateToken } = require('../middleware/auth');

// Rotas públicas (sem autenticação)

// Listar todos os templates (público)
router.get('/', TemplateController.index);

// Buscar template por ID (público)
router.get('/:id', TemplateController.show);

// Preview do template (público)
router.get('/:templateId/preview', TemplateController.preview);

// Buscar por categoria (público)
router.get('/category/:category', TemplateController.byCategory);

// Buscar categorias disponíveis (público)
router.get('/meta/categories', TemplateController.categories);

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