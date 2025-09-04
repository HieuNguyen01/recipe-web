const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const { ratingLimiter } = require("../middleware/rateLimiter");
const validateBody = require("../middleware/validateBody");
const validateParam      = require('../utils/validateParam');
const { rateRecipeSchema } = require("../validation/rating");
const { rateRecipe, myRating } = require("../controllers/ratingController");
const Recipe             = require('../models/Recipe');

router.param('id', validateParam('id', Recipe, 'authorId image', 'recipe'));

router.post(
  "/",
  auth,
  ratingLimiter,
  validateBody(rateRecipeSchema),
  rateRecipe
);

router.get("/", auth, myRating);

module.exports = router;
