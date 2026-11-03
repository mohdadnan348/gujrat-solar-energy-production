const express = require('express');
const router = express.Router();
const { generatePayroll, getAllPayrolls, getMyPayrolls, finalizePayroll } = require('../controllers/payrollController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);
router.get('/my', authorize('Employee', 'Admin', 'HR'), getMyPayrolls);
router.use(authorize('Admin', 'HR'));
router.post('/generate', generatePayroll);
router.get('/', getAllPayrolls);
router.put('/:id/finalize', finalizePayroll);
module.exports = router;
