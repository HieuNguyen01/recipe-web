const express        = require('express');
const mongoose     = require('mongoose');
const Recipe        = require('../models/Recipe');
const validateParam  = require('../utils/validateParam');
const auth           = require('../middleware/auth');
const optionalAuth   = require('../middleware/optionalAuth');
const validateBody   = require('../middleware/validateBody');
const paramAsync   = require('../utils/paramAsync');
const catchAsync    = require('../utils/catchAsync');
const ApiError      = require('../utils/ApiError');
const { validUnits } = require('../models/Recipe');
const { createRecipe, getRecipes, getRecipeById, updateRecipe, deleteRecipe } = require('../controllers/recipeController');
const { createRecipeSchema, updateRecipeSchema } = require('../validation/recipe');
const { addComment, getAllComments, updateComment, deleteComment } = require('../controllers/commentController');
const { addCommentSchema } = require('../validation/comment');
const { likeLimiter } = require('../middleware/rateLimiter');
const likeController   = require('../controllers/likeController');

const router = express.Router();

/* ────────────────────────────────────────── */
/*              PARAM VALIDATION             */
/* ────────────────────────────────────────── */
// Single param hook that does both validation & loading
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



// commentId
router.param('commentId', validateParam('commentId'));

/* ────────────────────────────────────────── */
/*                RECIPE ROUTES              */
/* ────────────────────────────────────────── */

// GET /api/recipe/units
router.get('/units', (req, res) => {
  res.json(validUnits);
});

// GET /api/recipe
router.get(
  '/',
  optionalAuth,
  catchAsync(getRecipes)
);

// POST /api/recipe
router.post(
  '/',
  auth,
  validateBody(createRecipeSchema),
  catchAsync(createRecipe)
);

// GET /api/recipe/:id
router.get(
  '/:id',
  catchAsync(getRecipeById)
);

// PUT /api/recipe/:id
router.put(
  '/:id',
  auth,
  validateBody(updateRecipeSchema),
  catchAsync(updateRecipe)
);

// DELETE /api/recipe/:id
router.delete(
  '/:id',
  auth,
  catchAsync(deleteRecipe)
);

// POST /api/recipe/:id/rate
// router.post(
//   '/:id/rate',
//   auth,
//   validateBody(createRecipeSchema.pick(['value'])),
//   catchAsync(rateRecipe)
// );

// POST /api/recipe/:id/like
router.post(
  '/:id/like',
  auth,
  likeLimiter,
  catchAsync(likeController.likeRecipe)
);

// GET /api/recipe/:id/comment
router.get(
  '/:id/comment',
  catchAsync(getAllComments)
);

// POST /api/recipe/:id/comment
router.post(
  '/:id/comment',
  auth,
  validateBody(addCommentSchema),
  catchAsync(addComment)
);

// PUT /api/recipe/:id/comment/:commentId
router.put(
  '/:id/comment/:commentId',
  auth,
  validateBody(addCommentSchema),
  catchAsync(updateComment)
);

// DELETE /api/recipe/:id/comment/:commentId
router.delete(
  '/:id/comment/:commentId',
  auth,
  catchAsync(deleteComment)
);

//image route mount
router.use('/:id/image', require('./image'));
router.use('/:id/rate', require('./rating'));

module.exports = router;