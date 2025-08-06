// src/middleware/optionalAuth.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      const token   = header.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(payload.id).select('-password');
      if (user) req.user = user;
    } catch (err) {
      // invalid or expired token → silently ignore
      console.warn('Optional auth failed:', err.message);
    }
  }
  next();
}

module.exports = optionalAuth;
