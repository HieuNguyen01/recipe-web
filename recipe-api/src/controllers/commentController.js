const Comment = require('../models/Comment');
const Recipe = require('../models/Recipe');
const { success, error } = require('../utils/response');

exports.addComment = async (req, res, next) => {
  const authorId = req.user.id;
  const recipeId = req.params.recipeId;
  const { content } = req.body;

  try {
    // Ensure recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return error(res, 404, 'Recipe not found', 'RECIPE_NOT_FOUND');
    }

    // Create the comment
    let comment = await Comment.create({
      authorId,
      recipe: recipeId,
      content: content.trim(),
    });

    // Populate authorId → { _id, name } and convert to POJO
    comment = await comment.populate('authorId', 'name');
    comment = comment.toObject();

    comment.author = comment.authorId;
    delete comment.authorId;
    // Return the new comment under a clear key
    return success(res, 'Comment added', comment);
  } catch (err) {
    console.error('addComment error:', err);
    return error(res, 500, 'Server error adding comment');
  }
};

exports.updateComment = async (req, res) => {
  const authorId = req.user.id;
  const { recipeId, commentId } = req.params;
  const trimmed = req.body.content.trim();

  try {
    // fetch
    const comment = await Comment.findById(commentId);
    if (!comment || comment.recipe.toString() !== recipeId) {
      return error(res, 404, 'Comment not found', 'COMMENT_NOT_FOUND');
    }

    // authorize
    if (comment.author.toString() !== authorId) {
      return error(res, 403, 'Not allowed to edit this comment', 'UNAUTHORIZED_COMMENT');
    }

    // save
    comment.content = trimmed;
    comment.updatedAt = Date.now();
    await comment.save();

    await comment.populate('author', 'name');
    return success(res, 'Comment updated', comment);
  } catch (err) {
    console.error('updateComment error:', err);
    return error(res, 500, 'Server error updating comment');
  }
};


exports.getAllComments = async (req, res) => {
  const { recipeId } = req.params;
  try {
    const comments = await Comment
      .find({ recipe: recipeId })
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    return success(res, 'Comments fetched', comments);
  } catch (err) {
    console.error('getAllComments error:', err);
    return error(res, 500, 'Server error fetching comments');
  }
};

exports.deleteComment = async (req, res) => {
  const authorId = req.user.id;
  const { recipeId, commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment || comment.recipe.toString() !== recipeId) {
      return error(res, 404, 'Comment not found', 'COMMENT_NOT_FOUND');
    }
    if (comment.author.toString() !== authorId) {
      return error(res, 403, 'Not allowed to delete this comment', 'UNAUTHORIZED_COMMENT');
    }
    await comment.deleteOne();
    return success(res, 'Comment deleted');
  } catch (err) {
    console.error('Error deleting comment:', err);
    return error(res, 500, 'Server error deleting comment');
  }
};