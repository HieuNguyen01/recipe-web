const express  = require('express');
const mongoose = require('mongoose');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const router   = express.Router();
const auth     = require('../middleware/auth');
const { createRecipe, getRecipes, getRecipeById, updateRecipe,
  deleteRecipe, rateRecipe, likeRecipe, createAvatar, getAvatar
} = require('../controllers/recipeController');
const optionalAuth  = require('../middleware/optionalAuth');
const { addComment, getAllComments, updateComment, deleteComment } = require('../controllers/commentController');

// // ─── Multer configuration for avatars ────────────────────────────────
// const AVATAR_DIR = path.join(__dirname, '../../app/storage/avatar');
// const avatarStorage = multer.diskStorage({
//    destination(req, file, cb) {
//    // ensure folder exists
//    fs.mkdirSync(AVATAR_DIR, { recursive: true });
//    cb(null, AVATAR_DIR);
//    },
//    filename(req, file, cb) {
//    // always save as {recipeId}.jpg
//    cb(null, `${req.params.id}.jpg`);
//    }
// });

// const avatarUpload = multer({
//   storage: avatarStorage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
//   fileFilter(req, file, cb) {
//     const allowed = ['image/jpeg', 'image/png', 'image/webp'];
//     if (allowed.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//         cb(new Error('Unsupported file type. Only JPG, PNG, WEBP allowed.'));
//     }
//   }
// });


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

// ── Recipe avatar endpoints ─────────────────────────────────────────────
router.post(
  '/:id/avatar',
  auth,
  validateObjectId('id'),
  express.json(),      // parse JSON bodies
  createAvatar
);

// Fetch avatar
// router.get(
//   '/:id/avatar',
//   validateObjectId('id'),
//   getAvatar
// );

module.exports = router;