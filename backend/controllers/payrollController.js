const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { calculatePayroll } = require('../services/payrollService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

// @desc    Generate / Recalculate payroll for an employee
// @route   POST /api/payroll/generate
// @access  Private (Admin only)
const generatePayroll = catchAsync(async (req, res) => {
  const { employeeId, month, year } = req.body;

  // 1. Get Employee Details
  const employee = await User.findById(employeeId);
  if (!employee || employee.role !== 'Employee') {
    return res.status(404).json(new ApiResponse(404, null, 'Employee not found'));
  }

  if (employee.monthlySalary <= 0) {
    return res.status(400).json(new ApiResponse(400, null, 'Employee salary not configured'));
  }

  // 2. Fetch Attendance for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const attendanceRecords = await Attendance.find({
    employee: employeeId,
    date: { $gte: startDate, $lte: endDate }
  });

  // 3. Calculate Payroll
  const calculation = calculatePayroll(employee.monthlySalary, attendanceRecords);

  // 4. Check if payroll already exists
  let existingPayroll = await Payroll.findOne({ employee: employeeId, month, year });

  if (existingPayroll) {
    // Agar finalized/paid hai toh change nahi kar sakte
    if (existingPayroll.status !== 'Draft') {
      return res.status(400).json(new ApiResponse(400, null, 'Payroll already finalized or paid. Cannot recalculate.'));
    }

    // Draft ko update karo nayi calculation ke saath
    Object.assign(existingPayroll, calculation);
    await existingPayroll.save();

    return res.status(200).json(new ApiResponse(200, existingPayroll, 'Payroll recalculated successfully (Draft updated)'));
  }

  // 5. Naya Payroll record banao (Draft)
  const payroll = await Payroll.create({
    employee: employeeId,
    month,
    year,
    ...calculation,
    status: 'Draft'
  });

  res.status(201).json(new ApiResponse(201, payroll, 'Payroll generated as Draft. Please review and finalize.'));
});

// @desc    Get all payrolls (Admin only)
// @route   GET /api/payroll
// @access  Private (Admin only)
const getAllPayrolls = catchAsync(async (req, res) => {
  const { month, year, status } = req.query;
  let query = {};

  if (month && year) {
    query.month = month;
    query.year = year;
  }
  if (status) {
    query.status = status;
  }

  const payrolls = await Payroll.find(query)
    .populate('employee', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, payrolls, 'Payrolls fetched successfully'));
});

// @desc    Get my salary slips (Employee only)
// @route   GET /api/payroll/my
// @access  Private (Employee & Admin)
const getMyPayrolls = catchAsync(async (req, res) => {
  const payrolls = await Payroll.find({ 
    employee: req.user._id,
    status: { $in: ['Finalized', 'Paid'] }
  }).sort({ year: -1, month: -1 });

  res.status(200).json(new ApiResponse(200, payrolls, 'My salary slips fetched successfully'));
});

// @desc    Finalize Payroll (Lock the record)
// @route   PUT /api/payroll/:id/finalize
// @access  Private (Admin only)
const finalizePayroll = catchAsync(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);

  if (!payroll) {
    return res.status(404).json(new ApiResponse(404, null, 'Payroll record not found'));
  }

  if (payroll.status !== 'Draft') {
    return res.status(400).json(new ApiResponse(400, null, 'Only Draft payrolls can be finalized'));
  }

  payroll.status = 'Finalized';
  payroll.finalizedBy = req.user._id;
  payroll.finalizedAt = Date.now();

  await payroll.save();
  res.status(200).json(new ApiResponse(200, payroll, 'Payroll finalized successfully. Record is now locked.'));
});

module.exports = {
  generatePayroll,
  getAllPayrolls,
  getMyPayrolls,
  finalizePayroll,
};