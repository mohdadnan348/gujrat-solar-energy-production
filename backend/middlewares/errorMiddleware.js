const ApiResponse = require('../utils/apiResponse');

const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json(new ApiResponse(404, null, message));
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json(new ApiResponse(400, null, message));
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json(new ApiResponse(400, null, message));
  }

  res.status(err.statusCode || 500).json(
    new ApiResponse(err.statusCode || 500, null, error.message || 'Server Error')
  );
};

module.exports = errorMiddleware;