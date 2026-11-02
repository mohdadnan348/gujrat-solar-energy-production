const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  rate: { type: Number, required: true, min: 0 },
  qty: { type: Number, required: true, min: 0.000001 },
  gstRate: { type: Number, default: 0, enum: [0, 5, 12, 18, 28] },
  taxableValue: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  placeOfSupply: { type: String, default: '09- UTTAR PRADESH' },
  items: [invoiceItemSchema],
  taxableAmount: { type: Number, required: true, min: 0 },
  cgst_2_5: { type: Number, default: 0 }, sgst_2_5: { type: Number, default: 0 },
  cgst_6: { type: Number, default: 0 }, sgst_6: { type: Number, default: 0 },
  cgst_9: { type: Number, default: 0 }, sgst_9: { type: Number, default: 0 },
  cgst_14: { type: Number, default: 0 }, sgst_14: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  amountInWords: { type: String },
  paidAmount: { type: Number, default: 0 },
  paymentHistory: [{ amount: Number, date: { type: Date, default: Date.now }, mode: String, note: String }],
  status: { type: String, enum: ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'], default: 'Draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
