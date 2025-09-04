const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

exports.register = catchAsync(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // email check
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(400, 'Email already in use');
  }

  // password check
  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const user = await User.create({ name, email, password: hash });

  // issue token
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

  res.status(201).json({ token });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new ApiError(400, 'Invalid credentials');
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

  res.json({
    token,
    user: { id: user.id, name: user.name }
  });
});