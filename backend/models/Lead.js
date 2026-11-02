const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  source: { 
    type: String, // e.g., Facebook, Reference, Walk-in
    required: true
  },
  interestedSystem: { 
    type: String // e.g., 3KW Ongrid, 5KW Hybrid
  },
  location: { type: String },
  requirementNotes: { type: String },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Interested', 'Site Visit', 'Converted', 'Lost'], 
    default: 'New' 
  },
  followUpDate: { type: Date },
  
  // Assignment
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' // Employee
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // Status change history (Audit Trail)
  statusHistory: [{
    status: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);