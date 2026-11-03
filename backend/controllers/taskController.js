const Task = require('../models/Task');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const idOf = (value) => String(value?._id || value || '');

const getHrOwnerForEmployee = (employee) => {
  // Keep the same HR ownership mapping convention used by the employee records.
  const owner = employee.hrManager || employee.reportingTo || employee.ownerHR || employee.createdBy;
  return owner && owner.role !== 'Admin' ? owner : null;
};

const getTaskScope = (user) => {
  if (user.role === 'Admin') return {};
  if (user.role === 'HR') return { ownerHR: user._id };
  return { assignedTo: user._id };
};

// @desc Create a task for an employee in the HR's own team
// @route POST /api/tasks
// @access Admin, HR
const createTask = catchAsync(async (req, res) => {
  const { title, description, assignedTo, priority, startDate, dueDate } = req.body;
  if (!title?.trim() || !assignedTo) {
    return res.status(400).json(new ApiResponse(400, null, 'Task title and assigned employee are required'));
  }

  const employee = await User.findById(assignedTo);
  if (!employee || employee.role !== 'Employee') {
    return res.status(404).json(new ApiResponse(404, null, 'Assigned employee not found'));
  }

  let ownerHR = null;
  if (req.user.role === 'HR') {
    const employeeOwner = getHrOwnerForEmployee(employee);
    if (!employeeOwner || idOf(employeeOwner) !== idOf(req.user._id)) {
      return res.status(403).json(new ApiResponse(403, null, 'You can assign tasks only to employees in your team'));
    }
    ownerHR = req.user._id;
  } else {
    const employeeOwner = getHrOwnerForEmployee(employee);
    ownerHR = employeeOwner ? employeeOwner._id || employeeOwner : null;
  }

  const task = await Task.create({
    title: title.trim(),
    description: description || '',
    assignedTo: employee._id,
    assignedBy: req.user._id,
    createdBy: req.user._id,
    ownerHR,
    priority: priority || 'Normal',
    startDate: startDate || undefined,
    dueDate: dueDate || undefined,
    status: 'To Do'
  });

  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name role');
  res.status(201).json(new ApiResponse(201, populated, 'Task created and assigned successfully'));
});

// @desc Get tasks visible to current user
// @route GET /api/tasks
const getTasks = catchAsync(async (req, res) => {
  const query = getTaskScope(req.user);
  if (req.query.status) query.status = req.query.status;
  if (req.query.priority) query.priority = req.query.priority;

  // Admin may filter by any employee; HR is restricted to their team.
  if (req.query.assignedTo && req.user.role !== 'Employee') {
    query.assignedTo = req.query.assignedTo;
  }

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name role')
    .populate('comments.addedBy', 'name role')
    .sort({ dueDate: 1, createdAt: -1 });

  res.status(200).json(new ApiResponse(200, tasks, 'Tasks fetched successfully'));
});

// @desc Get one task within the current user's scope
const getTaskById = catchAsync(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ...getTaskScope(req.user) })
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name role')
    .populate('comments.addedBy', 'name role');

  if (!task) return res.status(404).json(new ApiResponse(404, null, 'Task not found'));
  res.status(200).json(new ApiResponse(200, task, 'Task fetched successfully'));
});

// @desc HR/Admin edit task details; employee can only update own status/comments
const updateTask = catchAsync(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ...getTaskScope(req.user) });
  if (!task) return res.status(404).json(new ApiResponse(404, null, 'Task not found'));

  if (req.user.role === 'Employee') {
    return res.status(403).json(new ApiResponse(403, null, 'Employees can update task status only'));
  }

  const { title, description, assignedTo, priority, status, startDate, dueDate } = req.body;
  if (title !== undefined) task.title = title.trim();
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (status !== undefined) task.status = status;
  if (startDate !== undefined) task.startDate = startDate || null;
  if (dueDate !== undefined) task.dueDate = dueDate || null;

  if (assignedTo && idOf(assignedTo) !== idOf(task.assignedTo)) {
    const employee = await User.findById(assignedTo);
    if (!employee || employee.role !== 'Employee') {
      return res.status(404).json(new ApiResponse(404, null, 'Assigned employee not found'));
    }
    if (req.user.role === 'HR') {
      const employeeOwner = getHrOwnerForEmployee(employee);
      if (!employeeOwner || idOf(employeeOwner) !== idOf(req.user._id)) {
        return res.status(403).json(new ApiResponse(403, null, 'You can assign tasks only to employees in your team'));
      }
      task.ownerHR = req.user._id;
    } else {
      const employeeOwner = getHrOwnerForEmployee(employee);
      task.ownerHR = employeeOwner ? employeeOwner._id || employeeOwner : null;
    }
    task.assignedTo = employee._id;
  }

  await task.save();
  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name role');
  res.status(200).json(new ApiResponse(200, populated, 'Task updated successfully'));
});

// @desc Update status and add a progress comment
const updateTaskStatus = catchAsync(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ...getTaskScope(req.user) });
  if (!task) return res.status(404).json(new ApiResponse(404, null, 'Task not found'));

  const { status, comment } = req.body;
  if (status) task.status = status;
  if (comment?.trim()) {
    task.comments.push({ text: comment.trim(), addedBy: req.user._id });
  }
  await task.save();
  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('comments.addedBy', 'name role');
  res.status(200).json(new ApiResponse(200, populated, 'Task updated successfully'));
});

// @desc Reassign a task; Admin can assign anywhere, HR only within own team
const reassignTask = catchAsync(async (req, res) => {
  const { newEmployeeId } = req.body;
  const task = await Task.findOne({ _id: req.params.id, ...getTaskScope(req.user) });
  if (!task) return res.status(404).json(new ApiResponse(404, null, 'Task not found'));

  const employee = await User.findById(newEmployeeId);
  if (!employee || employee.role !== 'Employee') {
    return res.status(404).json(new ApiResponse(404, null, 'New employee not found'));
  }
  const employeeOwner = getHrOwnerForEmployee(employee);
  if (req.user.role === 'HR' &&
      (!employeeOwner || idOf(employeeOwner) !== idOf(req.user._id))) {
    return res.status(403).json(new ApiResponse(403, null, 'You can reassign only within your team'));
  }

  task.assignedTo = employee._id;
  if (req.user.role === 'HR') task.ownerHR = req.user._id;
  else task.ownerHR = employeeOwner ? employeeOwner._id || employeeOwner : null;
  task.comments.push({ text: `Task reassigned to ${employee.name}`, addedBy: req.user._id });
  await task.save();
  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name role');
  res.status(200).json(new ApiResponse(200, populated, 'Task reassigned successfully'));
});

// @desc Delete a task within the current user's scope
const deleteTask = catchAsync(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, ...getTaskScope(req.user) });
  if (!task) return res.status(404).json(new ApiResponse(404, null, 'Task not found'));
  if (req.user.role === 'Employee') {
    return res.status(403).json(new ApiResponse(403, null, 'Employees cannot delete tasks'));
  }
  await task.deleteOne();
  res.status(200).json(new ApiResponse(200, null, 'Task deleted successfully'));
});

module.exports = {
  createTask, getTasks, getTaskById, updateTask, updateTaskStatus,
  reassignTask, deleteTask
};
