const Recipe     = require('../models/Recipe');
const Comment    = require('../models/Comment');
const ApiError   = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

/**
 * POST /api/recipe/:id/comment
 */
exports.addComment = catchAsync(async (req, res) => {
  const authorId = req.user.id;
  const recipeId = req.params.id;
  const content  = req.body.content.trim();

  // 1) Ensure recipe exists
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new ApiError(404, 'Recipe not found');
  }

  // 2) Create comment
  let comment = await Comment.create({ authorId, recipeId, content });

  // 3) Populate author, transform to clean JSON
  comment = await comment.populate('authorId', 'name');
  const obj = comment.toObject();        // plugin strips __v/_id, adds id
  obj.author = obj.authorId;
  delete obj.authorId;

  // 4) Respond
  res.status(201).json(obj);
});


/**
 * GET /api/recipe/:id/comment
 */
exports.getAllComments = catchAsync(async (req, res) => {
  const recipeId = req.params.id;

  // 1) Fetch comments
  const comments = await Comment.find({ recipeId })
    .populate('authorId', 'name')
    .sort({ createdAt: -1 });

  // 2) Transform each comment
  const result = comments.map((c) => {
    const obj = c.toObject();
    obj.author = obj.authorId;
    delete obj.authorId;
    return obj;
  });

  // 3) Respond
  res.json(result);
});


/**
 * PUT /api/recipe/:id/comment/:commentId
 */
exports.updateComment = catchAsync(async (req, res) => {
  const { id: recipeId, commentId } = req.params;
  const authorId = req.user.id;
  const content  = req.body.content.trim();

  // 1) Ensure recipe exists
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new ApiError(404, 'Recipe not found');
  }

  // 2) Ensure comment exists & belongs to recipe
  const comment = await Comment.findById(commentId);
  if (!comment || comment.recipeId.toString() !== recipeId) {
    throw new ApiError(404, 'Comment not found');
  }

  // 3) Authorization check
  if (comment.authorId.toString() !== authorId) {
    throw new ApiError(403, 'Not allowed to edit this comment');
  }

  // 4) Apply update
  comment.content   = content;
  comment.updatedAt = new Date();
  await comment.save();

  // 5) Populate & transform
  const populated = await comment.populate('authorId', 'name');
  const obj = populated.toObject();
  obj.author = obj.authorId;
  delete obj.authorId;

  // 6) Respond
  res.json(obj);
});


/**
 * DELETE /api/recipe/:id/comment/:commentId
 */
exports.deleteComment = catchAsync(async (req, res) => {
  const { id: recipeId, commentId } = req.params;
  const authorId = req.user.id;

  // 1) Ensure recipe exists
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new ApiError(404, 'Recipe not found');
  }

  // 2) Ensure comment exists & belongs to recipe
  const comment = await Comment.findById(commentId);
  if (!comment || comment.recipeId.toString() !== recipeId) {
    throw new ApiError(404, 'Comment not found');
  }

  // 3) Authorization check
  if (comment.authorId.toString() !== authorId) {
    throw new ApiError(403, 'Not allowed to delete this comment');
  }

  // 4) Delete
  await comment.deleteOne();

  // 5) Respond
  res.status(204).end();
});
