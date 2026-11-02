const Task = require('../models/Task');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

// @desc    Create and assign a new task
// @route   POST /api/tasks
// @access  Private (Admin only)
const createTask = catchAsync(async (req, res) => {
  const { title, description, assignedTo, priority, startDate, dueDate } = req.body;

  // Verify assigned employee exists
  const employee = await User.findById(assignedTo);
  if (!employee) {
    return res.status(404).json(new ApiResponse(404, null, 'Assigned employee not found'));
  }

  const task = await Task.create({
    title,
    description,
    assignedTo,
    assignedBy: req.user._id,
    priority: priority || 'Normal',
    startDate,
    dueDate,
    status: 'To Do'
  });

  res.status(201).json(new ApiResponse(201, task, 'Task created and assigned successfully'));
});

// @desc    Get tasks (Admin sees all, Employee sees own)
// @route   GET /api/tasks
// @access  Private
const getTasks = catchAsync(async (req, res) => {
  let query = {};

  // Employee can only see tasks assigned to them
  if (req.user.role === 'Employee') {
    query.assignedTo = req.user._id;
  }

  // Filters
  if (req.query.status) query.status = req.query.status;
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.assignedTo && req.user.role === 'Admin') {
    query.assignedTo = req.query.assignedTo;
  }

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name')
    .sort({ dueDate: 1, priority: -1 });

  res.status(200).json(new ApiResponse(200, tasks, 'Tasks fetched successfully'));
});

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private (Admin or Assigned Employee)
const getTaskById = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name')
    .populate('comments.addedBy', 'name role');

  if (!task) {
    return res.status(404).json(new ApiResponse(404, null, 'Task not found'));
  }

  // Employee can only view their own task
  if (req.user.role === 'Employee' && task.assignedTo._id.toString() !== req.user._id.toString()) {
    return res.status(403).json(new ApiResponse(403, null, 'Not authorized to view this task'));
  }

  res.status(200).json(new ApiResponse(200, task, 'Task fetched successfully'));
});

// @desc    Update task status & add progress notes
// @route   PUT /api/tasks/:id/status
// @access  Private (Assigned Employee & Admin)
const updateTaskStatus = catchAsync(async (req, res) => {
  const { status, comment } = req.body;
  
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json(new ApiResponse(404, null, 'Task not found'));
  }

  // Authorization check
  if (req.user.role === 'Employee' && task.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json(new ApiResponse(403, null, 'Not authorized to update this task'));
  }

  // Update status if provided
  if (status) {
    task.status = status;
  }

  // Add comment if provided
  if (comment) {
    task.comments.push({
      text: comment,
      addedBy: req.user._id,
      addedAt: Date.now()
    });
  }

  await task.save();
  res.status(200).json(new ApiResponse(200, task, 'Task updated successfully'));
});

// @desc    Reassign task to another employee (Admin only)
// @route   PUT /api/tasks/:id/reassign
// @access  Private (Admin only)
const reassignTask = catchAsync(async (req, res) => {
  const { newEmployeeId } = req.body;

  const employee = await User.findById(newEmployeeId);
  if (!employee) {
    return res.status(404).json(new ApiResponse(404, null, 'New employee not found'));
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json(new ApiResponse(404, null, 'Task not found'));
  }

  task.assignedTo = newEmployeeId;
  task.comments.push({
    text: `Task reassigned by Admin to ${employee.name}`,
    addedBy: req.user._id,
    addedAt: Date.now()
  });

  await task.save();
  res.status(200).json(new ApiResponse(200, task, 'Task reassigned successfully'));
});

// @desc    Delete task (Admin only)
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
const deleteTask = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json(new ApiResponse(404, null, 'Task not found'));
  }

  await task.deleteOne();
  res.status(200).json(new ApiResponse(200, null, 'Task deleted successfully'));
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTaskStatus,
  reassignTask,
  deleteTask,
};