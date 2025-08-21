const ApiError = require('../utils/ApiError');

module.exports = (schema) => async (req, res, next) => {
  try {
    const validated = await schema.validate(req.body, {
      abortEarly:  false,
      stripUnknown: true
    });
    req.body = validated;
    next();
  } catch (err) {
    // Flatten Yup errors
    const errors = {};
    err.inner?.forEach(({ path, message }) => {
      if (!errors[path]) errors[path] = message;
    });
    return next(
      new ApiError(400, 'Validation error', errors)
    );
  }
};
