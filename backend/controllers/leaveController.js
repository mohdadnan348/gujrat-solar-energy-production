const mongoose = require('mongoose');
const Leave = require('../models/Leave');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const VALID_LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Unpaid Leave'];
const VALID_STATUSES = ['Approved', 'Rejected'];

const parseDateOnly = (value) => {
  if (!value || typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getInclusiveDays = (startDate, endDate) =>
  Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;

const isAdmin = (user) => user?.role === 'Admin';
const isHR = (user) => user?.role === 'HR';

// Resolve the employee's assigned HR using the same ownership fields used by the CRM.
const getEmployeeHR = (employee) =>
  employee.hrManager || employee.reportingTo || employee.ownerHR || employee.createdBy || null;

// Employee applies for leave. The employee identity always comes from the authenticated session.
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

  const ownerHR = getEmployeeHR(req.user);
  const leave = await Leave.create({
    employee: req.user._id,
    ownerHR,
    leaveType,
    startDate: start,
    endDate: end,
    days: getInclusiveDays(start, end),
    reason: String(reason).trim(),
    status: 'Pending',
  });

  const populatedLeave = await Leave.findById(leave._id)
    .populate('employee', 'name email mobile')
    .populate('ownerHR', 'name email');
  return res.status(201).json(
    new ApiResponse(201, populatedLeave, 'Leave application submitted successfully')
  );
});

// Employee sees only their own leave requests.
const getMyLeaves = catchAsync(async (req, res) => {
  const leaves = await Leave.find({ employee: req.user._id })
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, leaves, 'My leaves fetched successfully'));
});

// Admin sees all requests; HR sees only requests owned by that HR.
const getAllLeaves = catchAsync(async (req, res) => {
  if (!isAdmin(req.user) && !isHR(req.user)) {
    return res.status(403).json(new ApiResponse(403, null, 'You are not allowed to view leave requests'));
  }
  const query = isAdmin(req.user) ? {} : { ownerHR: req.user._id };
  const leaves = await Leave.find(query)
    .populate('employee', 'name email mobile')
    .populate('ownerHR', 'name email')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, leaves, 'Leave requests fetched successfully'));
});

// Admin can review all requests; HR can review only their own team's requests.
const updateLeaveStatus = catchAsync(async (req, res) => {
  const { status, adminNote = '' } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid status. Use Approved or Rejected.'));
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid leave request ID'));
  }
  if (!isAdmin(req.user) && !isHR(req.user)) {
    return res.status(403).json(new ApiResponse(403, null, 'You are not allowed to review leave requests'));
  }

  const scope = isAdmin(req.user) ? {} : { ownerHR: req.user._id };
  const leave = await Leave.findOne({ _id: req.params.id, ...scope });
  if (!leave) {
    return res.status(404).json(new ApiResponse(404, null, 'Leave request not found'));
  }
  if (leave.status !== 'Pending') {
    return res.status(409).json(
      new ApiResponse(409, null, `This leave request is already ${leave.status.toLowerCase()}`)
    );
  }

  leave.status = status;
  leave.adminNote = String(adminNote || '').trim();
  leave.reviewedBy = req.user._id;
  // Keep legacy field populated for compatibility with existing screens/reports.
  leave.approvedBy = req.user._id;
  await leave.save();

  const updatedLeave = await Leave.findById(leave._id)
    .populate('employee', 'name email mobile')
    .populate('reviewedBy', 'name email')
    .populate('approvedBy', 'name email');
  return res.status(200).json(
    new ApiResponse(200, updatedLeave, `Leave ${status.toLowerCase()} successfully`)
  );
});

module.exports = { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus };
