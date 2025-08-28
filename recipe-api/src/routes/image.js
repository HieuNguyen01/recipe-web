// src/routes/image.js
const express       = require('express');
const mongoose      = require('mongoose');
const Recipe        = require('../models/Recipe');
const ApiError      = require('../utils/ApiError');
const paramAsync    = require('../utils/paramAsync');
const validateBody  = require('../middleware/validateBody');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { uploadImageSchema } = require('../validation/image');
const { createImage, getImage } = require('../controllers/imageController');
const auth          = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// 1) Preload & validate :id → req.recipe
router.param(
  'id',
  paramAsync(async (req, res, next, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid recipe ID');
    }
    const recipe = await Recipe.findById(id).select('authorId image');
    if (!recipe) {
      throw new ApiError(404, 'Recipe not found');
    }
    req.recipe = recipe;
    next();
  })
);

// 2) POST /api/recipe/:id/image
router.post(
  '/',
  auth,
  uploadLimiter,
  validateBody(uploadImageSchema),
  createImage
);

// 3) GET /api/recipe/:id/image
router.get(
  '/',
  getImage
);

module.exports = router;
