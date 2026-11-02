const express = require('express');
const router = express.Router();
const { 
  createQuotation, 
  getQuotations, 
  getQuotationById, 
  updateQuotation, 
  updateQuotationStatus,
  downloadQuotationPDF
} = require('../controllers/quotationController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All routes require login AND Admin role
router.use(protect);
router.use(authorize('Admin')); 

router.route('/')
  .post(createQuotation)
  .get(getQuotations);

router.route('/:id')
  .get(getQuotationById)
  .put(updateQuotation);

router.route('/:id/status')
  .put(updateQuotationStatus);

router.route('/:id/pdf')
  .get(downloadQuotationPDF);

module.exports = router;