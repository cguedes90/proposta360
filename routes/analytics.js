const express = require('express');
const {
  getProposalAnalytics,
  getDashboardOverview,
  getProposalPerformance,
  getShareableLink
} = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardOverview);
router.get('/performance', getProposalPerformance);
router.get('/proposal/:id', getProposalAnalytics);
router.get('/proposal/:id/share-links', getShareableLink);

// Rotas avançadas REATIVADAS - Analytics Premium
router.get('/proposal/:id/engagement', getEngagementAnalytics);
router.get('/proposal/:id/conversion-funnel', getConversionFunnel);
router.get('/proposal/:id/heatmap', getHeatmapData);
router.get('/proposal/:id/real-time', getRealTimeAnalytics);
router.get('/follow-up/:id/schedule', getFollowUpSchedule);
router.post('/follow-up/:id/schedule', scheduleFollowUp);
router.get('/geographic-analysis', getGeographicAnalysis);
router.get('/behavioral-insights', getBehavioralInsights);

module.exports = router;