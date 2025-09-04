const ApiError   = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const Recipe     = require('../models/Recipe');
const Like       = require('../models/Like');

exports.likeRecipe = catchAsync(async (req, res) => {
  const recipeId = req.params.id;
  const userId   = req.user.id;

  // 1) Existence check
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new ApiError(404, 'Recipe not found');
  }

  // 2) Toggle like
  const removed = await Like.findOneAndDelete({ user: userId, recipeId });
  if (!removed) {
    await Like.create({ user: userId, recipeId });
  }

  // 3) Return new like state + count
  const likeCount = await Like.countDocuments({ recipeId });
  res.json({ liked: !removed, likeCount });
});