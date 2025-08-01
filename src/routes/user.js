const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById
} = require('../controllers/userControllers');

// GET /api/users
router.get('/', getAllUsers);

// GET /api/users/:id
router.get('/:id', getUserById);

module.exports = router;
