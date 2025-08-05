const Comment = require('../models/Comment');
const Recipe  = require('../models/Recipe');

exports.addComment = async (req, res) => {
  const userId   = req.user.id;          // from auth middleware
  const recipeId = req.params.recipeId;
  const { content } = req.body;

  // validation
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: 'Comment cannot be empty' });
  }

  try {
    // Ensure recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Create comment
    const comment = await Comment.create({ author: userId, recipe: recipeId, content:content.trim() });
    // Optionally populate author username
    await comment.populate('author', 'username');
    res.status(201).json({ data: comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding comment' });
  }
};

/**
 * PUT /api/recipes/:recipeId/comments/:commentId
 */
exports.updateComment = async (req, res) => {
  const userId      = req.user.id;
  const { recipeId, commentId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Comment cannot be empty' });
  }

  try {
    const comment = await Comment.findById(commentId);
    if (!comment || comment.recipe.toString() !== recipeId) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not allowed to edit this comment' });
    }

    comment.content   = content.trim();
    comment.updatedAt = Date.now();
    await comment.save();

    // Populate author.username
    await comment.populate('author', 'username');

    return res.json(comment);
  } catch (err) {
    console.error('Error updating comment:', err);
    return res.status(500).json({ message: 'Server error updating comment' });
  }
};


exports.getAllComments = async (req, res) => {
  const { recipeId } = req.params;

  try {
    const comments = await Comment.find({ recipe: recipeId })
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    return res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ message: 'Server error fetching comments' });
  }
};

exports.deleteComment = async (req, res) => {
  const userId    = req.user.id;
  const { recipeId, commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment || comment.recipe.toString() !== recipeId) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not allowed to delete this comment' });
    }

    await comment.deleteOne();
    return res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return res.status(500).json({ message: 'Server error deleting comment' });
  }
};
