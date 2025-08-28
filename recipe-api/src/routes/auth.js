const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const validateBody = require('../middleware/validateBody');
const { registerSchema, loginSchema } = require('../validation/auth');
const { authLimiter }= require('../middleware/rateLimiter');
const catchAsync = require('../utils/catchAsync');

router.post('/register',
  authLimiter,
  validateBody(registerSchema),
  catchAsync(register)
);

router.post('/login',
  authLimiter,
  validateBody(loginSchema),
  catchAsync(login)
);

module.exports = router;
