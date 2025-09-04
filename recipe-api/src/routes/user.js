// routes/users.js
const express           = require('express');
const auth              = require('../middleware/auth');
const catchAsync    = require('../utils/catchAsync');
const { getMe, getAllUsers } = require('../controllers/userController');

const router = express.Router();

// Get currently authenticated user
router.get('/me', auth, catchAsync(getMe));

// List all users
router.get('/', catchAsync(getAllUsers));

// Get a specific user
// router.get(
//   '/:id',
//   validateObjectId('id'),
//   catchAsync(getUserById)
// );

module.exports = router;
