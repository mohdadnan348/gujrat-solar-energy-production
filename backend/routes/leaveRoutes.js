const express = require('express');
const router = express.Router();

const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
} = require('../controllers/leaveController');

const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

// Employee-only endpoints
router.post('/', authorize('Employee'), applyLeave);
router.get('/my', authorize('Employee'), getMyLeaves);

// Admin-only endpoints
router.get('/', authorize('Admin'), getAllLeaves);
router.put('/:id/status', authorize('Admin'), updateLeaveStatus);

module.exports = router;
