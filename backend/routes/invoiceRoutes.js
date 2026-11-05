const express = require("express");
const router = express.Router();

const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  recordPayment,
  downloadInvoicePDF,
  downloadInvoiceMaterialListPDF,
} = require("../controllers/invoiceController");

const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");

router.use(protect);

// Admin and HR can view invoices. HR data is scoped to Customer.ownerHR
// inside the controller.
router.get("/", authorize("Admin", "HR"), getInvoices);
router.get("/:id", authorize("Admin", "HR"), getInvoiceById);

// Invoice creation, editing and PDF download remain Admin-only.
router.post("/", authorize("Admin", "HR"), createInvoice);
router.put("/:id", authorize("Admin", "HR"), updateInvoice);
router.get("/:id/pdf", authorize("Admin", "HR"), downloadInvoicePDF);
router.get("/:id/material-list/pdf", authorize("Admin", "HR"), downloadInvoiceMaterialListPDF);

// Admin can set Sent/Cancelled; HR can set Sent only for their own team.
router.put("/:id/status", authorize("Admin", "HR"), updateInvoiceStatus);

// Existing payment endpoint is not part of this status-only UI change.
// If retained by the project, it is Admin-only (never HR).
router.post("/:id/payments", authorize("Admin"), recordPayment);

module.exports = router;
