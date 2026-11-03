const express = require('express');
const router = express.Router();
const { getAdminStats, getHRStats } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

// Keep separate endpoints: Admin gets global data; HR gets team-scoped data.
router.get('/stats', authorize('Admin'), getAdminStats);
router.get('/hr-stats', authorize('HR'), getHRStats);

module.exports = router;
