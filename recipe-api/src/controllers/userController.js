//usercontroller
const User = require('../models/User');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const { success, error } = require('../utils/response');

/**
 * GET /user
 */
async function getAllUsers(req, res) {
  try {
    const users = await User.find().select('-password');
    return success(res, 'Users fetched successfully', users);
  } catch (err) {
    console.error('getAllUsers error:', err);
    return error(res, 500, 'Server error fetching users');
  }
}

/**
 * GET /user/:id
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return error(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    return success(res, 'User fetched successfully', user);
  } catch (err) {
    console.error(`getUserById error (id=${req.params.id}):`, err);
    return error(res, 500, 'Server error fetching user');
  }
}

/**
 * GET /user/me
 */
async function getMe(req, res) {
  try {
    return success(res, 'Authenticated user fetched', req.user);
  } catch (err) {
    console.error('getMe error:', err);
    return error(res, 500, 'Server error');
  }
}

module.exports = { getAllUsers, getUserById, getMe };