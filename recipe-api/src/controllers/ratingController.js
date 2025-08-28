// src/controllers/ratingController.js
const Recipe     = require('../models/Recipe');
const Rating     = require('../models/Rating');
const ApiError   = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

exports.rateRecipe = catchAsync(async (req, res) => {
  const recipeId = req.params.id;
  const userId   = req.user.id;
  const { value } = req.body;

  // Ensure recipe exists
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new ApiError(404, 'Recipe not found');
  }

  // If value is null or undefined, clear the vote
  if (value == null) {
    await Rating.findOneAndDelete({ user: userId, recipe: recipeId });
    return res.status(204).end();
  }

  // Upsert the user's rating
  await Rating.findOneAndUpdate(
    { user: userId, recipeId },
    { value },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Recalculate stats, converting the string ID to ObjectId in-pipeline
  const agg = await Rating.aggregate([
    {
      $match: {
        $expr: {
          $eq: [
            '$recipeId',
            { $toObjectId: recipeId }
          ]
        }
      }
    },
    {
      $group: {
        _id:     '$recipeId',
        count:   { $sum: 1 },
        average: { $avg: '$value' }
      }
    },
    {
      $project: {
        _id:           0,
        recipeId:      '$_id',
        count:         1,
        averageRating: { $round: ['$average', 1] }
      }
    }
  ]);

  // Extract or default
  const { count = 0, averageRating = 0 } = agg[0] || {};

  // Persist rounded stats back to Recipe
  await Recipe.findByIdAndUpdate(recipeId, {
    ratingCount:   count,
    averageRating
  });

  // Return JSON
  res.json({ ratingCount: count, averageRating });
});

exports.myRating = catchAsync(async (req, res) => {
  const recipeId = req.params.id;
  const userId   = req.user.id;

  // 1) Fetch the user's rating document
  const doc = await Rating.findOne({ recipeId, user: userId });

  // 2) If none exists, return null so UI knows "no vote yet"
  const rating = doc ? doc.value : null;

  // 3) Respond
  res.json({ rating });
});