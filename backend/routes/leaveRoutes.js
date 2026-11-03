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

// Employees submit and view their own leave applications.
router.post('/', authorize('Employee'), applyLeave);
router.get('/my', authorize('Employee'), getMyLeaves);

// Admin has global access; HR is restricted to their own team's leave requests in the controller.
router.get('/', authorize('Admin', 'HR'), getAllLeaves);
router.put('/:id/status', authorize('Admin', 'HR'), updateLeaveStatus);

module.exports = router;
