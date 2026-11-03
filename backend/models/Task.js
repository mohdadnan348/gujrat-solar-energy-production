const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  ownerHR: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  priority: { type: String, enum: ['Low', 'Normal', 'High', 'Urgent'], default: 'Normal' },
  startDate: { type: Date },
  dueDate: { type: Date },
  status: { type: String, enum: ['To Do', 'In Progress', 'Blocked', 'Completed'], default: 'To Do' },
  comments: [{
    text: { type: String, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

taskSchema.index({ ownerHR: 1, status: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
