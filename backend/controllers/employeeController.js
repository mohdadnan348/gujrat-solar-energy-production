const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const employeeFields = '-password';

const getEmployees = catchAsync(async (req, res) => {
  const employees = await User.find({ role: 'Employee' })
    .select(employeeFields)
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, employees, 'Employees fetched successfully'),
  );
});

const createEmployee = catchAsync(async (req, res) => {
  const { name, email, password, mobile, monthlySalary } = req.body;

  if (!name?.trim() || !email?.trim() || !password || !mobile?.trim()) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Name, email, password and mobile are required'),
    );
  }
  if (password.length < 6) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Password must contain at least 6 characters'),
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    return res.status(409).json(
      new ApiResponse(409, null, 'User with this email already exists'),
    );
  }

  const salary = monthlySalary === undefined || monthlySalary === '' ? 0 : Number(monthlySalary);
  if (!Number.isFinite(salary) || salary < 0) {
    return res.status(400).json(
      new ApiResponse(400, null, 'Monthly salary must be a valid non-negative number'),
    );
  }

  const employee = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    mobile: mobile.trim(),
    monthlySalary: salary,
    role: 'Employee',
    isActive: true,
  });

  const safeEmployee = await User.findById(employee._id).select(employeeFields);
  return res.status(201).json(
    new ApiResponse(201, safeEmployee, 'Employee created successfully'),
  );
});

const updateEmployee = catchAsync(async (req, res) => {
  const employee = await User.findOne({ _id: req.params.id, role: 'Employee' });
  if (!employee) {
    return res.status(404).json(new ApiResponse(404, null, 'Employee not found'));
  }

  const { name, email, mobile, monthlySalary, isActive, password } = req.body;

  if (name !== undefined) {
    if (!String(name).trim()) {
      return res.status(400).json(new ApiResponse(400, null, 'Name cannot be empty'));
    }
    employee.name = String(name).trim();
  }

  if (email !== undefined) {
    if (!String(email).trim()) {
      return res.status(400).json(new ApiResponse(400, null, 'Email cannot be empty'));
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const duplicate = await User.findOne({ email: normalizedEmail, _id: { $ne: employee._id } });
    if (duplicate) {
      return res.status(409).json(new ApiResponse(409, null, 'User with this email already exists'));
    }
    employee.email = normalizedEmail;
  }

  if (mobile !== undefined) {
    if (!String(mobile).trim()) {
      return res.status(400).json(new ApiResponse(400, null, 'Mobile cannot be empty'));
    }
    employee.mobile = String(mobile).trim();
  }

  if (monthlySalary !== undefined) {
    const salary = Number(monthlySalary);
    if (!Number.isFinite(salary) || salary < 0) {
      return res.status(400).json(new ApiResponse(400, null, 'Monthly salary must be a valid non-negative number'));
    }
    employee.monthlySalary = salary;
  }

  if (isActive !== undefined) employee.isActive = Boolean(isActive);

  if (password) {
    if (password.length < 6) {
      return res.status(400).json(new ApiResponse(400, null, 'Password must contain at least 6 characters'));
    }
    // User model's pre-save hook is expected to hash modified passwords.
    employee.password = password;
  }

  await employee.save();
  const safeEmployee = await User.findById(employee._id).select(employeeFields);
  return res.status(200).json(
    new ApiResponse(200, safeEmployee, 'Employee updated successfully'),
  );
});

const deactivateEmployee = catchAsync(async (req, res) => {
  const employee = await User.findOne({ _id: req.params.id, role: 'Employee' });
  if (!employee) {
    return res.status(404).json(new ApiResponse(404, null, 'Employee not found'));
  }

  employee.isActive = false;
  await employee.save();

  const safeEmployee = await User.findById(employee._id).select(employeeFields);
  return res.status(200).json(
    new ApiResponse(200, safeEmployee, 'Employee deactivated successfully'),
  );
});

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
};
