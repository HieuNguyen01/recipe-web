const mongoose   = require('mongoose');
const ApiError   = require('./ApiError');

/**
 * @param {string}   name     Param name (e.g. 'id', 'commentId')
 * @param {Function} onValid  Optional: (req, value) => { … }
 */
function validateParam(name, onValid) {
  return (req, res, next, value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return next(new ApiError(400, `Invalid ${name}`));
    }
    if (onValid) {
      try {
        onValid(req, value);
      } catch (err) {
        return next(err);
      }
    }
    next();
  };
}

module.exports = validateParam;
