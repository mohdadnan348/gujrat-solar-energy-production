const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Company Profile (PDF Header & Footer ke liye)
  companyName: { type: String, default: 'GUJRAT SOLAR ENERGY' },
  ownerName: { type: String, default: 'Siddiqui Wasim' }, // NAYA FIELD - PDF me "By" ke liye
  gstin: { type: String, default: '09GBQPS0127B1ZL' },
  address: { type: String, default: '83/161-3 PARAMPURWA, JUH, Kanpur, UTTAR PRADESH, 208014' },
  mobile: { type: String, default: '+91 8545909039' },
  email: { type: String, default: 'gujratsolar14@gmail.com' },
  website: { type: String, default: 'www.gujratsolarenergy.com' },
  logoUrl: { type: String, default: '' }, // Cloudinary URL

  // Bank Details (PDF me dikhne ke liye)
  bankDetails: {
    bankName: { type: String, default: 'PUNJAB AND SIND BANK' },
    accountName: { type: String, default: 'GUJRAT SOLAR ENERGY' },
    accountNo: { type: String, default: '06241100006312' },
    ifsc: { type: String, default: 'PSIB0000624' },
    branch: { type: String, default: 'HARJINDER NAGAR KANPUR' }
  },

  // Terms & Conditions (PDF Page 6 & 7)
  terms: {
    generalTerms: { type: String, default: '' },
    governmentSubsidy: { type: String, default: '' },
    warrantyDetails: { type: String, default: '' },
    siteCompletionSchedule: { type: String, default: '' },
    paymentTerms: { type: String, default: '50% advance payment upon contract signing. 40% upon delivery of structure material. 10% before meter installation is complete.' },
    warrantyExclusions: { type: String, default: '' },
    scopeOfWork: { type: String, default: '' }
  },

  // Payroll Rules (Salary Calculation)
  payrollRules: {
    totalDaysInMonth: { type: Number, default: 30 },
    paidLeavesAllowed: { type: Number, default: 1 },
    halfDayHours: { type: Number, default: 4 } // Half day agar 4 ghante se kam kaam kiya
  }

}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);