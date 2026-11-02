const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Employee
    required: true 
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' // Admin
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Normal', 'High', 'Urgent'], 
    default: 'Normal' 
  },
  startDate: { type: Date },
  dueDate: { type: Date },
  status: { 
    type: String, 
    enum: ['To Do', 'In Progress', 'Blocked', 'Completed'], 
    default: 'To Do' 
  },
  
  // Progress & Comments
  comments: [{
    text: { type: String, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);