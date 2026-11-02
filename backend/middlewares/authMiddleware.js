const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json(new ApiResponse(401, null, 'Not authorized, no token provided'));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Get user from database and attach to request
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json(new ApiResponse(401, null, 'User no longer exists'));
    }

    if (!user.isActive) {
      return res.status(403).json(new ApiResponse(403, null, 'Account is deactivated. Contact Admin.'));
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(new ApiResponse(401, null, 'Not authorized, token failed or expired'));
  }
});

module.exports = { protect };