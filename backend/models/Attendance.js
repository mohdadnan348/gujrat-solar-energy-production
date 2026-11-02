const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Half-Day', 'Late', 'Weekly Off', 'Holiday', 'Paid Leave', 'Unpaid Leave'], 
    required: true 
  },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workHours: { type: Number, default: 0 }, // Auto-calculated or manual
  
  // Admin correction audit trail
  isCorrected: { type: Boolean, default: false },
  correctionReason: { type: String },
  correctedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ek employee ka ek din me ek hi record hona chahiye
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);