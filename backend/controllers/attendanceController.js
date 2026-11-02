const Attendance = require('../models/Attendance');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

// @desc    Mark Attendance (Check-IN)
// @route   POST /api/attendance/check-in
// @access  Private (Employee & Admin)
const checkIn = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight for comparison

  // Check if already checked in today
  let attendance = await Attendance.findOne({ 
    employee: req.user._id, 
    date: today 
  });

  if (attendance && attendance.checkIn) {
    return res.status(400).json(new ApiResponse(400, null, 'Already checked in for today'));
  }

  if (!attendance) {
    attendance = new Attendance({
      employee: req.user._id,
      date: today,
      status: 'Present', // Default status on check-in
      checkIn: new Date(),
    });
  } else {
    attendance.checkIn = new Date();
    attendance.status = 'Present';
  }

  await attendance.save();
  res.status(201).json(new ApiResponse(201, attendance, 'Checked in successfully'));
});

// @desc    Mark Attendance (Check-OUT)
// @route   PUT /api/attendance/check-out
// @access  Private (Employee & Admin)
const checkOut = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({ 
    employee: req.user._id, 
    date: today 
  });

  if (!attendance || !attendance.checkIn) {
    return res.status(400).json(new ApiResponse(400, null, 'You have not checked in today'));
  }

  if (attendance.checkOut) {
    return res.status(400).json(new ApiResponse(400, null, 'Already checked out for today'));
  }

  attendance.checkOut = new Date();
  
  // Calculate Work Hours
  const diffMs = attendance.checkOut - attendance.checkIn;
  attendance.workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)); // convert ms to hours

  // Auto-mark half day if less than 4 hours (Example Rule - can be changed in settings)
  if (attendance.workHours < 4) {
    attendance.status = 'Half-Day';
  }

  await attendance.save();
  res.status(200).json(new ApiResponse(200, attendance, 'Checked out successfully'));
});

// @desc    Get my attendance
// @route   GET /api/attendance/my
// @access  Private (Employee & Admin)
const getMyAttendance = catchAsync(async (req, res) => {
  // Optional filter by month/year
  const { month, year } = req.query;
  let query = { employee: req.user._id };

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    query.date = { $gte: startDate, $lte: endDate };
  }

  const attendance = await Attendance.find(query).sort({ date: -1 });
  res.status(200).json(new ApiResponse(200, attendance, 'Attendance fetched successfully'));
});

// @desc    Get all employees attendance (Admin only)
// @route   GET /api/attendance
// @access  Private (Admin only)
const getAllAttendance = catchAsync(async (req, res) => {
  const { date, employeeId } = req.query;
  let query = {};

  if (date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    query.date = targetDate;
  }

  if (employeeId) {
    query.employee = employeeId;
  }

  const attendance = await Attendance.find(query)
    .populate('employee', 'name email role')
    .sort({ date: -1 });

  res.status(200).json(new ApiResponse(200, attendance, 'All attendance fetched successfully'));
});

// @desc    Admin Correction for Attendance
// @route   PUT /api/attendance/:id/correct
// @access  Private (Admin only)
const correctAttendance = catchAsync(async (req, res) => {
  const { status, correctionReason } = req.body;

  if (!correctionReason) {
    return res.status(400).json(new ApiResponse(400, null, 'Correction reason is required for audit trail'));
  }

  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) {
    return res.status(404).json(new ApiResponse(404, null, 'Attendance record not found'));
  }

  // Update fields
  if (status) attendance.status = status;
  
  // Audit Trail update
  attendance.isCorrected = true;
  attendance.correctionReason = correctionReason;
  attendance.correctedBy = req.user._id;

  await attendance.save();
  res.status(200).json(new ApiResponse(200, attendance, 'Attendance corrected successfully (Audit logged)'));
});

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  correctAttendance,
};