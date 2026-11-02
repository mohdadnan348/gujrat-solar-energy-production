const express = require('express');
const router = express.Router();

const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Settings contain company, bank and PDF terms information.
// Only authenticated Admin users may view or change them.
router.use(protect);
router.use(authorize('Admin'));

router.route('/').get(getSettings).put(updateSettings);

module.exports = router;
