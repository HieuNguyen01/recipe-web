const express           = require('express');
const router            = express.Router({ mergeParams: true });
const auth              = require('../middleware/auth');
const { likeLimiter }   = require('../middleware/rateLimiter');
const {likeRecipe}    = require('../controllers/likeController');
const validateParam     = require('../utils/validateParam');
const Recipe            = require('../models/Recipe');

router.param('id', validateParam('id', Recipe, 'authorId image', 'recipe'));

router.post(
  '/',
  auth,
  likeLimiter,
  likeRecipe
);

module.exports = router;