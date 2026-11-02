const mongoose = require('mongoose');
const Leave = require('../models/Leave');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const VALID_LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Unpaid Leave'];
const VALID_STATUSES = ['Approved', 'Rejected'];

const parseDateOnly = (value) => {
  if (!value || typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getInclusiveDays = (startDate, endDate) => {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((endDate.getTime() - startDate.getTime()) / dayMs) + 1;
};

// POST /api/leaves — Employee applies for leave
const applyLeave = catchAsync(async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!VALID_LEAVE_TYPES.includes(leaveType)) {
    return res.status(400).json(new ApiResponse(400, null, 'Please select a valid leave type'));
  }

  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (!start || !end) {
    return res.status(400).json(new ApiResponse(400, null, 'Please provide valid start and end dates'));
  }
  if (end < start) {
    return res.status(400).json(new ApiResponse(400, null, 'End date must be on or after start date'));
  }
  if (!reason || !String(reason).trim()) {
    return res.status(400).json(new ApiResponse(400, null, 'Reason for leave is required'));
  }

  const days = getInclusiveDays(start, end);
  const leave = await Leave.create({
    employee: req.user._id,
    leaveType,
    startDate: start,
    endDate: end,
    days,
    reason: String(reason).trim(),
    status: 'Pending',
  });

  const populatedLeave = await Leave.findById(leave._id)
    .populate('employee', 'name email mobile');

  return res.status(201).json(
    new ApiResponse(201, populatedLeave, 'Leave application submitted successfully'),
  );
});

// GET /api/leaves/my — Employee sees only their own leave requests
const getMyLeaves = catchAsync(async (req, res) => {
  const leaves = await Leave.find({ employee: req.user._id })
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, leaves, 'My leaves fetched successfully'),
  );
});

// GET /api/leaves — Admin sees all leave requests
const getAllLeaves = catchAsync(async (req, res) => {
  const leaves = await Leave.find()
    .populate('employee', 'name email mobile')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, leaves, 'All leaves fetched successfully'),
  );
});

// PUT /api/leaves/:id/status — Admin approves/rejects a leave
const updateLeaveStatus = catchAsync(async (req, res) => {
  const { status, adminNote = '' } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Invalid status. Use Approved or Rejected.'),
    );
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid leave request ID'));
  }

  const leave = await Leave.findById(req.params.id);
  if (!leave) {
    return res.status(404).json(new ApiResponse(404, null, 'Leave request not found'));
  }
  if (leave.status !== 'Pending') {
    return res.status(409).json(
      new ApiResponse(409, null, `This leave request is already ${leave.status.toLowerCase()}`),
    );
  }

  leave.status = status;
  leave.adminNote = String(adminNote || '').trim();
  leave.approvedBy = req.user._id;
  await leave.save();

  const updatedLeave = await Leave.findById(leave._id)
    .populate('employee', 'name email mobile')
    .populate('approvedBy', 'name email');

  return res.status(200).json(
    new ApiResponse(200, updatedLeave, `Leave ${status.toLowerCase()} successfully`),
  );
});

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
};
