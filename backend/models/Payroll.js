const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ownerHR: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  monthlySalary: { type: Number, required: true },
  totalDaysInMonth: { type: Number, required: true },
  payableDays: { type: Number, required: true },
  perDayRate: { type: Number, required: true },
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  halfDays: { type: Number, default: 0 },
  paidLeaves: { type: Number, default: 0 },
  unpaidLeaves: { type: Number, default: 0 },
  weeklyOffs: { type: Number, default: 0 },
  holidays: { type: Number, default: 0 },
  basicPayable: { type: Number, required: true },
  additions: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPayable: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Finalized', 'Paid'], default: 'Draft' },
  finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  finalizedAt: { type: Date }
}, { timestamps: true });

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ ownerHR: 1, year: -1, month: -1 });

module.exports = mongoose.model('Payroll', payrollSchema);
