const express = require("express");
const validateBody = require("../middleware/validateBody");
const validateParam      = require('../utils/validateParam');
const { uploadLimiter } = require("../middleware/rateLimiter");
const { uploadImageSchema } = require("../validation/image");
const { createImage, getImage } = require("../controllers/imageController");
const auth = require("../middleware/auth");
const Recipe             = require('../models/Recipe');
const router = express.Router({ mergeParams: true });

router.param('id', validateParam('id', Recipe, 'authorId image', 'recipe'));

// POST /api/recipe/:id/image
router.post(
  "/",
  auth,
  uploadLimiter,
  validateBody(uploadImageSchema),
  createImage
);

// GET /api/recipe/:id/image
router.get("/", getImage);

module.exports = router;
