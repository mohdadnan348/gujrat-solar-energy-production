const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Customer name is required'], 
    trim: true 
  },
  mobile: { 
    type: String, 
    required: [true, 'Mobile number is required'], 
    trim: true 
  },
  email: { 
    type: String, 
    trim: true,
    lowercase: true
  },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  
  // Business details (optional)
  gstin: { type: String, trim: true },
  businessName: { type: String, trim: true },
  
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

// Search optimization ke liye index
customerSchema.index({ name: 'text', mobile: 1, email: 1 });

module.exports = mongoose.model('Customer', customerSchema);