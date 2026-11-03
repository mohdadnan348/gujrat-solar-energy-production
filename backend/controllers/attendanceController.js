const Attendance = require('../models/Attendance');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const getHrEmployeeIds = async (hrId) => {
  const employees = await User.find({
    role: 'Employee',
    $or: [
      { createdBy: hrId },
      { reportingTo: hrId },
      { hrManager: hrId },
      { ownerHR: hrId },
    ],
  }).select('_id');
  return employees.map((employee) => employee._id);
};

const getEmployeeOwnerHR = async (employee) => {
  const candidateIds = [
    employee.hrManager,
    employee.reportingTo,
    employee.createdBy,
    employee.ownerHR,
  ].filter(Boolean);

  if (!candidateIds.length) return null;
  const hr = await User.findOne({
    _id: { $in: candidateIds },
    role: 'HR',
  }).select('_id');
  return hr?._id || null;
};

// POST /api/attendance/check-in
const checkIn = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let attendance = await Attendance.findOne({ employee: req.user._id, date: today });
  if (attendance?.checkIn) {
    return res.status(400).json(new ApiResponse(400, null, 'Already checked in for today'));
  }

  const ownerHR = req.user.role === 'Employee' ? await getEmployeeOwnerHR(req.user) : null;

  if (!attendance) {
    attendance = new Attendance({
      employee: req.user._id,
      ownerHR,
      date: today,
      status: 'Present',
      checkIn: new Date(),
    });
  } else {
    attendance.checkIn = new Date();
    attendance.status = 'Present';
    if (!attendance.ownerHR && ownerHR) attendance.ownerHR = ownerHR;
  }

  await attendance.save();
  res.status(201).json(new ApiResponse(201, attendance, 'Checked in successfully'));
});

// PUT /api/attendance/check-out
const checkOut = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const attendance = await Attendance.findOne({ employee: req.user._id, date: today });

  if (!attendance?.checkIn) {
    return res.status(400).json(new ApiResponse(400, null, 'You have not checked in today'));
  }
  if (attendance.checkOut) {
    return res.status(400).json(new ApiResponse(400, null, 'Already checked out for today'));
  }

  attendance.checkOut = new Date();
  attendance.workHours = Number(((attendance.checkOut - attendance.checkIn) / 3600000).toFixed(2));
  if (attendance.workHours < 4) attendance.status = 'Half-Day';

  await attendance.save();
  res.status(200).json(new ApiResponse(200, attendance, 'Checked out successfully'));
});

// GET /api/attendance/my
const getMyAttendance = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  const query = { employee: req.user._id };

  if (month && year) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 1);
    query.date = { $gte: startDate, $lt: endDate };
  }

  const attendance = await Attendance.find(query).sort({ date: -1 });
  res.status(200).json(new ApiResponse(200, attendance, 'Attendance fetched successfully'));
});

// GET /api/attendance — Admin sees all; HR sees only employees assigned to that HR.
const getAllAttendance = catchAsync(async (req, res) => {
  const { date, employeeId, status } = req.query;
  const query = {};

  if (date) {
    const targetDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(targetDate.getTime())) {
      return res.status(400).json(new ApiResponse(400, null, 'Invalid attendance date'));
    }
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    query.date = { $gte: targetDate, $lt: nextDate };
  }

  if (employeeId) query.employee = employeeId;
  if (status) query.status = status;

  if (req.user.role === 'HR') {
    const employeeIds = await getHrEmployeeIds(req.user._id);
    query.$or = [
      { ownerHR: req.user._id },
      { employee: { $in: employeeIds } },
    ];
  }

  const attendance = await Attendance.find(query)
    .populate('employee', 'name email role')
    .sort({ date: -1 });

  res.status(200).json(new ApiResponse(200, attendance, 'Attendance fetched successfully'));
});

// PUT /api/attendance/:id/correct — Admin all; HR own team only.
const correctAttendance = catchAsync(async (req, res) => {
  const { status, correctionReason } = req.body;
  const validStatuses = ['Present', 'Absent', 'Half-Day', 'Late', 'Weekly Off', 'Holiday', 'Paid Leave', 'Unpaid Leave'];

  if (!correctionReason?.trim()) {
    return res.status(400).json(new ApiResponse(400, null, 'Correction reason is required for audit trail'));
  }
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid attendance status'));
  }

  const query = { _id: req.params.id };
  if (req.user.role === 'HR') {
    const employeeIds = await getHrEmployeeIds(req.user._id);
    query.$or = [
      { ownerHR: req.user._id },
      { employee: { $in: employeeIds } },
    ];
  }

  const attendance = await Attendance.findOne(query);
  if (!attendance) {
    return res.status(404).json(new ApiResponse(404, null, 'Attendance record not found or access denied'));
  }

  if (status) attendance.status = status;
  attendance.isCorrected = true;
  attendance.correctionReason = correctionReason.trim();
  attendance.correctedBy = req.user._id;
  if (!attendance.ownerHR && req.user.role === 'HR') attendance.ownerHR = req.user._id;

  await attendance.save();
  res.status(200).json(new ApiResponse(200, attendance, 'Attendance corrected successfully (Audit logged)'));
});

module.exports = { checkIn, checkOut, getMyAttendance, getAllAttendance, correctAttendance };
