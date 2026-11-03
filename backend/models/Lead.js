const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  source: { type: String, required: true },
  interestedSystem: { type: String },
  location: { type: String },
  requirementNotes: { type: String },
  status: { type: String, enum: ['New', 'Contacted', 'Interested', 'Site Visit', 'Converted', 'Lost'], default: 'New' },
  followUpDate: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  ownerHR: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  statusHistory: [{
    status: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

leadSchema.index({ ownerHR: 1, createdAt: -1 });
leadSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Lead', leadSchema);
