const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  month: { 
    type: Number, // 1-12
    required: true 
  },
  year: { 
    type: Number, 
    required: true 
  },
  
  // Salary Basis Snapshot (At the time of calculation)
  monthlySalary: { type: Number, required: true },
  totalDaysInMonth: { type: Number, required: true },
  payableDays: { type: Number, required: true },
  perDayRate: { type: Number, required: true },
  
  // Attendance Summary Snapshot
  presentDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  halfDays: { type: Number, default: 0 },
  paidLeaves: { type: Number, default: 0 },
  unpaidLeaves: { type: Number, default: 0 },
  weeklyOffs: { type: Number, default: 0 },
  holidays: { type: Number, default: 0 },
  
  // Earnings & Deductions
  basicPayable: { type: Number, required: true }, // (perDayRate * payableDays)
  additions: { 
    type: Number, 
    default: 0 // Overtime, Bonus
  },
  deductions: { 
    type: Number, 
    default: 0 // Advances, Unpaid leaves, PF
  },
  
  netPayable: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['Draft', 'Finalized', 'Paid'], 
    default: 'Draft' 
  },
  
  // Audit
  finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  finalizedAt: { type: Date }
}, { timestamps: true });

// Ek employee ka ek month ka ek hi payroll record
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);