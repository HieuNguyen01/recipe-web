// middleware/auth.js
const jwt = require('jsonwebtoken')
const User = require('../models/User')

/**
 * Verifies the JWT in the Authorization header,
 * loads the user from DB, and attaches it to req.user.
 */
async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 'AUTH_TOKEN_MISSING', message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.id).select('-password')
    if (!user) {
      return res.status(401).json({ code: 'AUTH_TOKEN_INVALID', message: 'Token invalid or expired' })
    }

    req.user = user
    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    return res.status(401).json({ code: 'AUTH_TOKEN_INVALID', message: 'Token invalid or expired' })
  }
}

module.exports = auth;