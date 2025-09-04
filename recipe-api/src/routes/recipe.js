const express = require("express");
const auth = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const validateBody = require("../middleware/validateBody");
const catchAsync = require("../utils/catchAsync");
const { validUnits } = require("../models/Recipe");
const Recipe             = require('../models/Recipe');
const { createRecipe, getRecipes, getRecipeById, updateRecipe, deleteRecipe } = require("../controllers/recipeController");
const { createRecipeSchema, updateRecipeSchema } = require("../validation/recipe");
const validateParam      = require('../utils/validateParam');

const router = express.Router();

// Validate and load req.recipe on any route with :id
router.param( 'id', validateParam('id', Recipe, 'authorId image', 'recipe'));

//comment + image + rating + like mount
router.use("/:id/comment", require("./comment"));
router.use("/:id/image", require("./image"));
router.use("/:id/rate", require("./rating"));
router.use("/:id/like", require("./like"));

// GET /api/recipe/units
router.get("/units", (req, res) => {
  res.json(validUnits);
});

// GET /api/recipe
router.get("/", optionalAuth, catchAsync(getRecipes));

// POST /api/recipe
router.post(
  "/",
  auth,
  validateBody(createRecipeSchema),
  catchAsync(createRecipe)
);

// GET /api/recipe/:id
router.get("/:id", catchAsync(getRecipeById));

// PUT /api/recipe/:id
router.put(
  "/:id",
  auth,
  validateBody(updateRecipeSchema),
  catchAsync(updateRecipe)
);

// DELETE /api/recipe/:id
router.delete("/:id", auth, catchAsync(deleteRecipe));

module.exports = router;
