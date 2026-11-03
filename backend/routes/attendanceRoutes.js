const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  correctAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

// Logged-in users can mark and view their own attendance.
router.post('/check-in', checkIn);
router.put('/check-out', checkOut);
router.get('/my', getMyAttendance);

// Admin can manage all attendance; HR is restricted in the controller to own team.
router.get('/', authorize('Admin', 'HR'), getAllAttendance);
router.put('/:id/correct', authorize('Admin', 'HR'), correctAttendance);

module.exports = router;
