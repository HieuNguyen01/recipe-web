// routes/users.js

const express      = require('express');
const auth = require('../middleware/auth');
const ctrl         = require('../controllers/userController');
const router       = express.Router();

router.get('/',             ctrl.getAllUsers);
router.get('/me',           auth, ctrl.getMe);
router.get('/:id',          ctrl.getUserById);
// router.get('/:id/likes',    ctrl.getLikes);
// router.get('/:id/comments', ctrl.getComments);

module.exports = router;
