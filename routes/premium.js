const express = require('express');
const router = express.Router();
const PremiumController = require('../controllers/premiumController');
const { authenticateToken } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Carrinho de compras
router.post('/cart/:templateId', PremiumController.addToCart);
router.delete('/cart/:templateId', PremiumController.removeFromCart);
router.get('/cart', PremiumController.getCart);

// Cupons de desconto
router.post('/coupon/apply', PremiumController.applyCoupon);

// Processamento de pagamento
router.post('/purchase', PremiumController.processPurchase);

// Templates comprados
router.get('/purchased', PremiumController.getPurchased);

// Verificar acesso a template
router.get('/access/:templateId', PremiumController.checkAccess);

// Pagamento PIX (simulação para desenvolvimento)
router.post('/pix/generate', PremiumController.simulatePixPayment);
router.post('/pix/confirm', PremiumController.confirmPixPayment);

// Rotas administrativas
router.get('/admin/stats', PremiumController.getSalesStats);

module.exports = router;