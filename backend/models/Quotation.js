const mongoose = require('mongoose');

// Bill of Material (BOM) Sub-Schema
const bomItemSchema = new mongoose.Schema({
  srNo: { type: String },
  itemDescription: { type: String, required: true },
  qty: { type: Number, required: true },
  unit: { type: String, required: true },
  brand: { type: String },
  rate: { type: Number, default: 0 },       // <-- ADD
  gstRate: { type: Number, default: 0 },    // <-- ADD
  gstAmount: { type: Number, default: 0 },  // <-- ADD
  total: { type: Number, default: 0 }       // <-- ADD
});

const quotationSchema = new mongoose.Schema({
  estimateNo: { 
    type: String, 
    unique: true 
  },
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  
  leadName: { type: String },
  createdByName: { type: String, trim: true },
  panelBrand: { type: String, trim: true, default: '' },
  panelWattage: { type: Number, min: 0, default: 0 },
  panelTechnology: { type: String, trim: true, default: '' },
  subsidyDescription: { type: String, trim: true, default: 'Subsidy will be credited to your bank account directly.' },
  notes: { type: String, default: '' },
  branch: { type: String, enum: ['HEAD_OFFICE', 'MAIN_BRANCH', 'AZAMGAGH_BRANCH', 'FATEHPUR_BRANCH'], default: 'HEAD_OFFICE' },
  plantCapacity: { type: String },
  customerCategory: { type: String, enum: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'], default: 'RESIDENTIAL' },
  systemType: { type: String, enum: ['ON_GRID', 'OFF_GRID', 'HYBRID'], default: 'ON_GRID' },
  batteryIncluded: { type: Boolean, default: false },
  
  date: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  
  mainItem: {
    description: { type: String },
    panelDetails: { type: String },
    inverterDetails: { type: String },
    qty: { type: String },
    rate: { type: Number },
    discount: { type: Number },
    totalAmountWithTax: { type: Number }
  },
  
  materialTotalAmount: { type: Number, default: 0 },
  materialGstRate: { type: Number, default: 0 },
  perKwAmount: { type: Number, default: 0 },
  gstMode: { type: String, enum: ['EXTRA', 'INCLUDED'], default: 'EXTRA' },
  testimonials: [{ name: String, text: String, rating: { type: Number, default: 5 } }],
  gstType: { type: String, enum: ['CGST_SGST', 'IGST', 'NONE'], default: 'CGST_SGST' },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  subTotal: { type: Number },
  gstAmount: { type: Number },
  grandTotal: { type: Number },
  subsidyAmount: { type: String },
  amountInWords: { type: String },
  
  panelCount: { type: Number, required: true },
  roofImageUrl: { type: String },
  
  bom: [bomItemSchema],
  bomOptions: [{ optionId: String, name: String, items: [bomItemSchema] }],
  selectedBomOption: { type: String, default: '' },
  
  termsAndConditions: {
    generalTerms: { type: String },
    governmentSubsidy: { type: String },
    warrantyDetails: { type: String },
    panelWarranty: { type: String },
    inverterWarranty: { type: String },
    batteryWarranty: { type: String },
    bosWarranty: { type: String },
    maintenanceWarranty: { type: String },
    warrantyNotes: { type: String },
    siteCompletionSchedule: { type: String },
    paymentTerms: { type: String },
    warrantyExclusions: { type: String },
    scopeOfWork: { type: String }
  },

  status: { 
    type: String, 
    enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'], 
    default: 'Draft' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Quotation', quotationSchema);