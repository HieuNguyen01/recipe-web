const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const validateBody = require('../middleware/validateBody');
const { registerSchema, loginSchema } = require('../validation/auth');
const catchAsync = require('../utils/catchAsync');

router.post('/register',
  validateBody(registerSchema),
  catchAsync(register)
);

router.post('/login',
  validateBody(loginSchema),
  catchAsync(login)
);

module.exports = router;
