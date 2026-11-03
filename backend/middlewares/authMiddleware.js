
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Read JWT from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json(
      new ApiResponse(401, null, 'Not authorized, no token provided')
    );
  }

  try {
    // 2. Verify JWT
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(401).json(
        new ApiResponse(401, null, 'Invalid authentication token')
      );
    }

    // 3. Fetch latest user details from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json(
        new ApiResponse(401, null, 'User no longer exists')
      );
    }

    // 4. Check account status
    if (!user.isActive) {
      return res.status(403).json(
        new ApiResponse(
          403,
          null,
          'Account is deactivated. Contact Admin.'
        )
      );
    }

    // 5. Validate supported roles
    const allowedRoles = ['Admin', 'HR', 'Employee'];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json(
        new ApiResponse(403, null, 'Invalid user role')
      );
    }

    // 6. Attach authenticated user
    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(
        new ApiResponse(401, null, 'Session expired. Please login again.')
      );
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(
        new ApiResponse(401, null, 'Invalid authentication token')
      );
    }

    throw error;
  }
});

module.exports = { protect };
