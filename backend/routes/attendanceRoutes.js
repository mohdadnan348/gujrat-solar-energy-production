const express = require('express');
const router = express.Router();
const { 
  checkIn, 
  checkOut, 
  getMyAttendance, 
  getAllAttendance, 
  correctAttendance 
} = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All routes require login
router.use(protect);

// Employee Routes
router.post('/check-in', checkIn);
router.put('/check-out', checkOut);
router.get('/my', getMyAttendance);

// Admin Routes
router.get('/', authorize('Admin'), getAllAttendance);
router.put('/:id/correct', authorize('Admin'), correctAttendance);

module.exports = router;