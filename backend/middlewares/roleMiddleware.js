const ApiResponse = require('../utils/apiResponse');

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json(new ApiResponse(401, null, 'Not authorized'));
  if (!roles.includes(req.user.role)) {
    return res.status(403).json(new ApiResponse(403, null, `Role (${req.user.role}) is not allowed to access this resource`));
  }
  next();
};

const adminOnly = authorize('Admin');
const adminOrHR = authorize('Admin', 'HR');
const allRoles = authorize('Admin', 'HR', 'Employee');

module.exports = { authorize, adminOnly, adminOrHR, allRoles };
