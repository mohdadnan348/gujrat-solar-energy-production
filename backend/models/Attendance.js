const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // HR responsible for this employee at the time this attendance is recorded.
  ownerHR: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half-Day', 'Late', 'Weekly Off', 'Holiday', 'Paid Leave', 'Unpaid Leave'],
    required: true
  },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workHours: { type: Number, default: 0 },
  isCorrected: { type: Boolean, default: false },
  correctionReason: { type: String },
  correctedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ ownerHR: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
