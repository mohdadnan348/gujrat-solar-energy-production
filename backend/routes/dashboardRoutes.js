const express = require('express');
const router = express.Router();

const { getAdminStats } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);
router.get('/stats', authorize('Admin'), getAdminStats);

module.exports = router;
