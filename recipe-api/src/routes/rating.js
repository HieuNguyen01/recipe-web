const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const { ratingLimiter } = require("../middleware/rateLimiter");
const validateBody = require("../middleware/validateBody");
const { rateRecipeSchema } = require("../validation/rating");
const { rateRecipe, myRating } = require("../controllers/ratingController");
const catchAsync = require("../utils/catchAsync");

router.post(
  "/",
  auth,
  ratingLimiter,
  validateBody(rateRecipeSchema),
  catchAsync(rateRecipe)
);

router.get("/", auth, catchAsync(myRating));

module.exports = router;
