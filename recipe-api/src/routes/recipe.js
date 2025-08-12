const express  = require('express');
const mongoose = require('mongoose');
const router   = express.Router();
const auth     = require('../middleware/auth');
const {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  rateRecipe,
  likeRecipe
} = require('../controllers/recipeController');
const optionalAuth  = require('../middleware/optionalAuth');
const { addComment, getAllComments, updateComment, deleteComment } = require('../controllers/commentController');

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

/**
 * GET /api/recipe
 * Public – list all recipes with optional filters & pagination
 * Query params: title, ingredient, page, limit
 */
//GET /api/recipe will run optionalAuth **before** getRecipes
router.get('/', optionalAuth, getRecipes);
/**
 * GET /api/recipe/:id
 * Public – fetch a single recipe
 */
router.get('/:id', validateObjectId('id'), getRecipeById);
/**
 * POST /api/recipe
 * Private – create a new recipe
 */
router.post('/', auth, createRecipe);
/**
 * PUT /api/recipe/:id
 * Private – update a recipe (author only)
 */
router.put('/:id', auth, validateObjectId('id'), updateRecipe);
/**
 * DELETE /api/recipe/:id
 * Private – delete a recipe (author only)
 */
router.delete('/:id', auth, validateObjectId('id'), deleteRecipe);

// ── Rating & Like Endpoints ──────────────────

/**
 * POST /api/recipe/:id/rate
 * Private – vote a 1–5 rating, returns { ratingCount, averageRating }
 */
router.post('/:id/rate', auth, validateObjectId('id'), rateRecipe);

/**
 * POST /api/recipe/:id/like
 * Private – toggle a like, returns { liked, likeCount }
 */
router.post('/:id/like', auth, validateObjectId('id'), likeRecipe);


/* ──────────────────────────────────────────── */
/*               COMMENT ROUTES                 */
/* ──────────────────────────────────────────── */

/**
 * GET   /api/recipe/:recipeId/comments
 * Public – list comments for a recipe
 */
router.get(
  '/:recipeId/comments',
  validateObjectId('recipeId'),
  getAllComments
);

/**
 * POST  /api/recipe/:recipeId/comments
 * Private – add a comment
 */
router.post(
  '/:recipeId/comments',
  auth,
  validateObjectId('recipeId'),
  validateCommentContent,
  addComment
);

/**
 * PUT /api/recipe/:recipeId/comments/:commentId
 * Private - update comment
 */
router.put(
  '/:recipeId/comments/:commentId',
  auth,
  validateObjectId('recipeId'),
  validateCommentContent,
  updateComment
);

/**
 * DELETE /api/recipe/:recipeId/comments/:commentId
 * Private – delete a comment
 */
router.delete(
  '/:recipeId/comments/:commentId',
  auth,
  validateObjectId('recipeId'),
  validateObjectId('commentId'),
  deleteComment
);

module.exports = router;