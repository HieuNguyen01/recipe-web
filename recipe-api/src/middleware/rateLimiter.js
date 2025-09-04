// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const ApiError  = require('../utils/ApiError');

// 3 login/register attempts per rolling 5 minutes (keyed by IP)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,        // 5 minutes
  max: 3,                         // limit each IP to 3 requests per window
  standardHeaders: true,          // send RateLimit-* headers
  legacyHeaders: false,           // disable X-RateLimit-* headers
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        'Too many login attempts. Please try again after 5 minutes.'
      )
    );
  }
});

// 10 image uploads per rolling 1 hour (keyed by authenticated user ID)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,       // 1 hour
  max: 10,                        // limit each user to 10 uploads per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id,  // req.user is set by auth middleware
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        'Image upload limit reached. Please try again later.'
      )
    );
  }
});

// 
const likeLimiter = rateLimit({
  windowMs:  60 * 1000,            // 1 minute
  max:       5,                   // limit to 5 toggles per min 
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id,  
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        'Too many like requests. Please try again in a minute.'
      )
    );
  }
});

const ratingLimiter = rateLimit({
  windowMs:  60 * 1000,
  max:       5,                   // limit to 5 attempts per min
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id,
  handler: (req, res, next) => {
    next(
      new ApiError(
        429,
        'Too many rating requests. Try again in a minute.'
      )
    );
  }
});

module.exports = { authLimiter, uploadLimiter, likeLimiter, ratingLimiter };
