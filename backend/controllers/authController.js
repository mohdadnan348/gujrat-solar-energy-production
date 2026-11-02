const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

// @desc    Register a new user (Admin creating Employee or Default Admin)
// @route   POST /api/auth/register
// @access  Public (Ideally Admin only, but keeping it open for initial setup)
const registerUser = catchAsync(async (req, res) => {
  const { name, email, password, role, mobile, monthlySalary } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json(new ApiResponse(400, null, 'User already exists with this email'));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Employee',
    mobile,
    monthlySalary: monthlySalary || 0,
  });

  if (user) {
    res.status(201).json(new ApiResponse(201, {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    }, 'User registered successfully'));
  } else {
    res.status(400).json(new ApiResponse(400, null, 'Invalid user data'));
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json(new ApiResponse(401, null, 'Invalid credentials'));
  }

  if (!user.isActive) {
    return res.status(403).json(new ApiResponse(403, null, 'Account is deactivated. Contact Admin.'));
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json(new ApiResponse(401, null, 'Invalid credentials'));
  }

  res.status(200).json(new ApiResponse(200, {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  }, 'Login successful'));
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = catchAsync(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, 'Profile fetched successfully'));
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};