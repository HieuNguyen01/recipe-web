const Comment = require('../models/Comment');
const Recipe = require('../models/Recipe');
const ApiError  = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

/**
 * POST /api/recipe/:id/comments
 */
exports.addComment = catchAsync(async (req, res) => {
  const authorId = req.user.id;
  const recipeId = req.params.id;
  const { content } = req.body;

  // Ensure recipe exists
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new ApiError(404, 'Recipe not found', { recipe: 'Recipe not found' });
  }

  // Create and populate the new comment
  let comment = await Comment.create({
    authorId,
    recipe:   recipeId,
    content:  content.trim(),
  });

  comment = await comment.populate('authorId', 'name');
  comment = comment.toObject();

  // Rename authorId → author
  comment.author = comment.authorId;
  delete comment.authorId;

  // 201 Created
  res.status(201).json(comment);
});

/**
 * GET /api/recipe/:id/comments
 */
exports.getAllComments = catchAsync(async (req, res) => {
  const recipeId = req.params.id;

  const comments = await Comment.find({ recipe: recipeId })
    .populate('author', 'name')
    .sort({ createdAt: -1 });

  res.json(comments);
});


// exports.updateComment = async (req, res) => {
//   const authorId = req.user.id;
//   const { recipeId, commentId } = req.params;
//   const trimmed = req.body.content.trim();

//   try {
//     // fetch
//     const comment = await Comment.findById(commentId);
//     if (!comment || comment.recipe.toString() !== recipeId) {
//       return error(res, 404, 'Comment not found', 'COMMENT_NOT_FOUND');
//     }

//     // authorize
//     if (comment.author.toString() !== authorId) {
//       return error(res, 403, 'Not allowed to edit this comment', 'UNAUTHORIZED_COMMENT');
//     }

//     // save
//     comment.content = trimmed;
//     comment.updatedAt = Date.now();
//     await comment.save();

//     await comment.populate('author', 'name');
//     return success(res, 'Comment updated', comment);
//   } catch (err) {
//     console.error('updateComment error:', err);
//     return error(res, 500, 'Server error updating comment');
//   }
// };

// exports.deleteComment = async (req, res) => {
//   const authorId = req.user.id;
//   const { recipeId, commentId } = req.params;

//   try {
//     const comment = await Comment.findById(commentId);
//     if (!comment || comment.recipe.toString() !== recipeId) {
//       return error(res, 404, 'Comment not found', 'COMMENT_NOT_FOUND');
//     }
//     if (comment.author.toString() !== authorId) {
//       return error(res, 403, 'Not allowed to delete this comment', 'UNAUTHORIZED_COMMENT');
//     }
//     await comment.deleteOne();
//     return success(res, 'Comment deleted');
//   } catch (err) {
//     console.error('Error deleting comment:', err);
//     return error(res, 500, 'Server error deleting comment');
//   }
// };