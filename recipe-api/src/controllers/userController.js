const User      = require('../models/User');
const ApiError  = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

/**
 * GET /api/users
 */
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('-password');
  // 200 OK
  res.json(users);
});

/**
 * GET /api/user/:id
 */
exports.getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found', { user: 'User not found' });
  }

  res.json(user);
});

/**
 * GET /api/user/me
 */
exports.getMe = catchAsync(async (req, res) => {
  // req.user is already sanitized by auth middleware
  res.json(req.user);
});
