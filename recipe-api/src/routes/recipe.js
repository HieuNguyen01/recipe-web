const express  = require('express');
const mongoose = require('mongoose');
const router   = express.Router();
const auth     = require('../middleware/auth');
const optionalAuth  = require('../middleware/optionalAuth');
const catchAsync    = require('../utils/catchAsync');
const validateBody  = require('../middleware/validateBody');
const { createRecipe, getRecipes, getRecipeById, updateRecipe,
  deleteRecipe, rateRecipe, likeRecipe, createAvatar
} = require('../controllers/recipeController');
const { createRecipeSchema, updateRecipeSchema } = require('../validation/recipe');
const { addComment, getAllComments } = require('../controllers/commentController');
const { addCommentSchema } = require('../validation/comment');
const  {validUnits} = require('../models/Recipe');


/* ──────────────────────────────────────────── */
/*                  HELPERS                     */
/* ──────────────────────────────────────────── */

// Validate any route param as a Mongo ObjectId
function validateObjectId(paramName) {
  return (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
      return res.status(400).json({ message: `Invalid ${paramName}` });
    }
    next();
  };
}

// Ensure POST body has non-empty "content"
function validateCommentContent(req, res, next) {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Comment content is required' });
  }
  next();
}


/* ──────────────────────────────────────────── */
/*               RECIPE ROUTES                  */
/* ──────────────────────────────────────────── */

// GET /api/recipe/units
// Returns the canonical list of allowed ingredient units
router.get("/units", (req, res) => {
  res.json(validUnits);
});

/**
 * GET /api/recipe
 * Public – list all recipes with optional filters & pagination
 * Query params: title, ingredient, page, limit
 */
//GET /api/recipe will run optionalAuth **before** getRecipes
router.get('/', optionalAuth, catchAsync(getRecipes));
/**
 * GET /api/recipe/:id
 * Public – fetch a single recipe
 */
router.get('/:id', validateObjectId('id'), catchAsync(getRecipeById));
// GET /api/units
// router.get("/units", getValidUnits);
/**
 * POST /api/recipe
 * Private – create a new recipe
 */
router.post('/',
  auth,
  validateBody(createRecipeSchema),
  catchAsync(createRecipe)
);
/**
 * PUT /api/recipe/:id
 * Private – update a recipe (author only)
 */
router.put('/:id',
  auth,
  validateObjectId('id'),
  validateBody(updateRecipeSchema),
  catchAsync(updateRecipe)
);

/**
 * DELETE /api/recipe/:id
 * Private – delete a recipe (author only)
 */
router.delete('/:id',
  auth,
  validateObjectId('id'),
  catchAsync(deleteRecipe)
);
// ── Rating & Like Endpoints ──────────────────

/**
 * POST /api/recipe/:id/rate
 * Private – vote a 1–5 rating, returns { ratingCount, averageRating }
 */
router.post('/:id/rate',
  auth,
  validateObjectId('id'),
  validateBody(
    require('../validation/recipe').createRecipeSchema.pick(['value'])
  ), // or build a tiny schema for { value: number().min(1).max(5) }
  catchAsync(rateRecipe)
);
/**
 * POST /api/recipe/:id/like
 * Private – toggle a like, returns { liked, likeCount }
 */
router.post('/:id/like',
  auth,
  validateObjectId('id'),
  catchAsync(likeRecipe)
);

/* ──────────────────────────────────────────── */
/*               COMMENT ROUTES                 */
/* ──────────────────────────────────────────── */

/**
 * GET   /api/recipe/:recipeId/comments
 * Public – list comments for a recipe
 */
router.get(
  '/:id/comments',
  validateObjectId('id'),
  getAllComments
);

/**
 * POST  /api/recipe/:recipeId/comments
 * Private – add a comment
 */
router.post(
  '/:id/comments',
  auth,
  validateObjectId('id'),
  validateBody(addCommentSchema),
  catchAsync(addComment)
);

// /**
//  * PUT /api/recipe/:recipeId/comments/:commentId
//  * Private - update comment
//  */
// router.put(
//   '/:id/comments/:commentId',
//   auth,
//   validateObjectId('id'),
//   validateCommentContent,
//   updateComment
// );

// /**
//  * DELETE /api/recipe/:recipeId/comments/:commentId
//  * Private – delete a comment
//  */
// router.delete(
//   '/:id/comments/:commentId',
//   auth,
//   validateObjectId('id'),
//   validateObjectId('commentId'),
//   deleteComment
// );

// ── Recipe avatar endpoints ─────────────────────────────────────────────
router.post('/:id/avatar',
  auth,
  validateObjectId('id'),
  validateBody(
    require('../validation/recipe').createRecipeSchema.pick(['image'])
  ),
  catchAsync(createAvatar)
);

// Fetch avatar
// router.get(
//   '/:id/avatar',
//   validateObjectId('id'),
//   getAvatar
// );

module.exports = router;