const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: 150,
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: 5000,
  },
  type: {
    type: String,
    enum: ['Announcement', 'Lead Assignment', 'Task Assignment', 'Leave Decision', 'Payroll'],
    default: 'Announcement',
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  }],
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, { timestamps: true });

notificationSchema.index({ recipients: 1, createdAt: -1 });
notificationSchema.index({ sentBy: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
