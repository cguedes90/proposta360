const express = require('express');
const router = express.Router();
const TrackingController = require('../controllers/trackingController');
const { authenticateToken } = require('../middleware/auth');

// Rotas públicas (não precisam de autenticação)
router.post('/register-visitor', TrackingController.registerVisitor);
router.post('/log-interaction', TrackingController.logInteraction);

// Rotas privadas (precisam de autenticação)
router.use(authenticateToken); // Aplicar middleware de autenticação para rotas abaixo

router.get('/analytics/:proposalId', TrackingController.getProposalAnalytics);
router.get('/realtime/:proposalId', TrackingController.getRealtimeVisitors);

module.exports = router;