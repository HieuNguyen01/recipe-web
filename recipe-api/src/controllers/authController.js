const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { success, error } = require('../utils/response');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return error(res, 400, 'Email already in use', 'EMAIL_IN_USE');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hash });
    //JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return success(res, 'Registration successful', { token });
  } catch (err) {
    console.error('register error:', err);
    return error(res, 500, 'Server error registering user');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return error(res, 400, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return error(res, 400, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return success(res, 'Login successful', { token });
  } catch (err) {
    console.error('login error:', err);
    return error(res, 500, 'Server error logging in');
  }
};