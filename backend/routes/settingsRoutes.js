const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);
router.use(authorize('Admin', 'HR'));
router.route('/').get(getSettings).put(updateSettings);
module.exports = router;
