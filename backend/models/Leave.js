const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ownerHR: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  leaveType: { type: String, enum: ['Sick Leave', 'Casual Leave', 'Unpaid Leave'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  adminNote: { type: String, default: '', trim: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

leaveSchema.index({ ownerHR: 1, status: 1, createdAt: -1 });
leaveSchema.index({ employee: 1, createdAt: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
