const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

const paymentController = new PaymentController();

// Webhook do Mercado Pago (sem autenticação - vem do MP)
router.post('/webhook', (req, res) => paymentController.webhook(req, res));

// Rotas que requerem autenticação
router.use(authenticateToken);

// Criar preferência de pagamento (checkout completo)
router.post('/create-preference', (req, res) => paymentController.createPreference(req, res));

// Criar pagamento PIX direto
router.post('/create-pix', (req, res) => paymentController.createPixPayment(req, res));

// Verificar status do pagamento
router.get('/status/:payment_id', (req, res) => paymentController.checkPaymentStatus(req, res));

module.exports = router;