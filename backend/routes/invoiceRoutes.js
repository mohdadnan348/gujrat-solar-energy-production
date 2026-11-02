
const express = require('express');
const router = express.Router();

const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  recordPayment,
  downloadInvoicePDF
} = require('../controllers/invoiceController');

const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Authentication and Admin Authorization
router.use(protect);
router.use(authorize('Admin'));

// Create Invoice / Get All Invoices
router.route('/')
  .post(createInvoice)
  .get(getInvoices);

// Download Invoice PDF
router.get('/:id/pdf', downloadInvoicePDF);

// Get Single Invoice / Update Invoice
router.route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice);

// Update Invoice Status
router.route('/:id/status')
  .put(updateInvoiceStatus);

// Record Invoice Payment
router.route('/:id/payments')
  .post(recordPayment);

module.exports = router;
