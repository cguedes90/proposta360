const express = require('express');
const router = express.Router();
const ShortLinkController = require('../controllers/shortLinkController');
const { authenticateToken } = require('../middleware/auth');

// Rota pública para redirecionamento (não precisa de auth)
router.get('/:shortCode', ShortLinkController.redirect);

// Rotas protegidas
router.use(authenticateToken);

// Obter ou criar link curto para uma proposta
router.get('/proposal/:proposalId', ShortLinkController.getShortLink);

// Obter estatísticas do link
router.get('/stats/:shortCode', ShortLinkController.getStats);

module.exports = router;