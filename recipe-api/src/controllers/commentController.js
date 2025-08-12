const Comment = require('../models/Comment');
const Recipe  = require('../models/Recipe');

exports.addComment = async (req, res, next) => {
  const authorId = req.user.id;
  const recipeId = req.params.recipeId;
  const { content } = req.body;

  try {
    // 1) Ensure recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // 2) Create the comment
    let comment = await Comment.create({
      authorId,
      recipe:  recipeId,
      content: content.trim(),
    });

    // 3) Populate authorId → { _id, name } and convert to POJO
    comment = await comment.populate('authorId', 'name');
    comment = comment.toObject();

    comment.author = comment.authorId;
    delete comment.authorId;
    // 5) Return the new comment under a clear key
    return res.status(201).json({ data: comment });
  } catch (err) {
    console.error('Error adding comment:', err);
    return res.status(500).json({ message: 'Server error adding comment' });
  }
};

/**
 * PUT /api/recipes/:recipeId/comments/:commentId
 */
exports.updateComment = async (req, res) => {
  const authorId = req.user.id;
  const { recipeId, commentId } = req.params;
  const trimmed = req.body.content.trim();

  try {
    // fetch
    const comment = await Comment.findById(commentId);
    if (!comment || comment.recipe.toString() !== recipeId) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // authorize
    if (comment.author.toString() !== authorId) {
      return res.status(403).json({ message: 'Not allowed to edit this comment' });
    }

    // save
    comment.content   = trimmed;
    comment.updatedAt = Date.now();
    await comment.save();

    await comment.populate('author', 'name');
    return res.json({ data: comment });

  } catch (err) {
    console.error('Error updating comment:', err);
    return res.status(500).json({ message: 'Server error updating comment' });
  }
};


exports.getAllComments = async (req, res) => {
  const { recipeId } = req.params;
  try {
    const comments = await Comment
      .find({ recipe: recipeId })
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    return res.json({ data: comments });
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ message: 'Server error fetching comments' });
  }
};

exports.deleteComment = async (req, res) => {
  const authorId    = req.user.id;
  const { recipeId, commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment || comment.recipe.toString() !== recipeId) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (comment.author.toString() !== authorId) {
      return res.status(403).json({ message: 'Not allowed to delete this comment' });
    }
    await comment.deleteOne();
    return res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return res.status(500).json({ message: 'Server error deleting comment' });
  }
};
