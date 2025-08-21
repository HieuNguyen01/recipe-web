const ApiError = require('../utils/ApiError');

module.exports = (err, req, res, next) => {
  console.error(err);

  // If it’s an ApiError, respect its statusCode
  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json({
        status:  err.statusCode < 500 ? 'fail' : 'error',
        message: err.message,
        errors:  err.errors
      });
  }

  // Fallback for unhandled errors
  return res.status(500).json({
    status:  'error',
    message: 'Internal server error',
    errors:  {}
  });
};
