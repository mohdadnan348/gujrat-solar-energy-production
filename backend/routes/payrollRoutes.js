const express = require('express');
const router = express.Router();
const { 
  generatePayroll, 
  getAllPayrolls, 
  getMyPayrolls, 
  finalizePayroll 
} = require('../controllers/payrollController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All routes require login
router.use(protect);

// Employee Routes
router.get('/my', getMyPayrolls);

// Admin Routes
router.use(authorize('Admin')); 

// POST /api/payroll/generate
router.post('/generate', generatePayroll);

// GET /api/payroll
router.get('/', getAllPayrolls);

// PUT /api/payroll/:id/finalize
router.put('/:id/finalize', finalizePayroll);

module.exports = router;