class ApiError extends Error {
  constructor(statusCode, message, errors = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;       // field-level error map
    this.isOperational = true;
  }
}

module.exports = ApiError;
