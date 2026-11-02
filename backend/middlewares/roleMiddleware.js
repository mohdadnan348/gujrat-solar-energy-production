const ApiResponse = require('../utils/apiResponse');

// Pass roles as arguments: authorize('Admin') or authorize('Admin', 'Employee')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, null, 'Not authorized'));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        new ApiResponse(403, null, `Role (${req.user.role}) is not allowed to access this resource`)
      );
    }
    next();
  };
};

module.exports = { authorize };