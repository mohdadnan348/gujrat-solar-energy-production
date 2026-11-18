const express = require('express');
const router = express.Router();
const {
  createQuotation, getQuotations, getQuotationById, updateQuotation,
  updateQuotationStatus, downloadQuotationPDF
} = require('../controllers/quotationController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);
router.use(authorize('Admin', 'HR', 'Employee'));

router.route('/').post(createQuotation).get(getQuotations);
router.route('/:id').get(getQuotationById).put(updateQuotation);
router.put('/:id/status', authorize('Admin', 'HR'), updateQuotationStatus);
router.get('/:id/pdf', downloadQuotationPDF);

module.exports = router;
