const mongoose = require('mongoose');
const { ObjectId } = mongoose.mongo;
const Recipe = require('../models/Recipe');
const Rating = require('../models/Rating');
const Like   = require('../models/Like');

// Inline helper to validate & clean up an array of step strings
function normalizeSteps(steps) {
  if (!Array.isArray(steps)) {
    throw new Error('Instructions must be an array of step strings');
  }

  const clean = steps
    .map(s => {
      if (typeof s !== 'string') {
        throw new Error('Each step must be a string');
      }
      return s.trim();
    })
    .filter(Boolean);

  if (clean.length === 0) {
    throw new Error('At least one instruction step is required');
  }
  return clean;
}

// CREATE a new recipe
exports.createRecipe = async (req, res) => {
  try {
    const {
      title,
      description,
      cookingTime,
      ingredients,
      instructions,
      image
    } = req.body;
    const cleanInstructions = normalizeSteps(instructions);
    const recipe = await Recipe.create({
      title,
      description,
      cookingTime,
      ingredients,
      instructions: cleanInstructions,
      image,
      authorId: req.user.id
    });

    return res.status(201).json(recipe);
  } catch (err) {
    console.error('Error creating recipe:', err);
    if (err.message.includes('Instructions must be') ||
        err.message.includes('Each step') ||
        err.message.includes('At least one') ||
        err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error creating recipe' });
  }
};

// GET all recipes with optional title/ingredient filters + pagination
exports.getRecipes = async (req, res) => {
  try {
    const { title, ingredient, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }
    if (ingredient) {
      filter['ingredients.name'] = { $regex: ingredient, $options: 'i' };
    }

    const pageNum = parseInt(page, 10) ;
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const docs = await Recipe.find(filter)
      .populate("authorId", "name")
      .collation({ locale: 'vi', strength: 1 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    //total pages
    const total = await Recipe.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    const currentUserId = req.user?._id.toString();
    const recipes = docs.map(doc => {
      const r = doc.toObject();    // gives you everything from Mongo
      // console.log(doc._id.toString());
      return {
        // Core listing fields (HomePage)
        id: r.id,
        title: r.title,
        image: r.image,
        author: r.authorId?.name || 'Unknown author',
        rating: r.averageRating,

        // Only mark editable if the logged-in user owns recipes on the list for triggering Edit button
        editable:     Boolean(currentUserId) && r.authorId?._id.toString() === currentUserId,

        // fields for later uses)
        description: r.description,
        cookingTime: r.cookingTime,
        ingredients: r.ingredients,
        instructions: r.instructions,
        likeCount: r.likeCount,
        ratingCount: r.ratingCount,
        comments: r.comments,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    res.json({
        recipes,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ message: 'Server error fetching recipes' });
  }
};

// GET single recipe by ID
exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe
      .findById(req.params.id)
      .populate("authorId", "name");
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE a recipe (only by its author)
exports.updateRecipe = async (req, res) => {
  try {
    const {
      title,
      description,
      cookingTime,
      ingredients,
      instructions,
      image
    } = req.body;

    let updates = { title, description, cookingTime, ingredients };

    if (typeof instructions !== 'undefined') {
      updates.instructions = normalizeSteps(instructions);
    }
    if (typeof image !== 'undefined') {
      updates.image = image;
    }

    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, authorId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!recipe) {
      return res
        .status(404)
        .json({ message: 'Recipe not found or you are unauthorized' });
    }
    return res.json(recipe);
  } catch (err) {
    console.error(`Error updating recipe ${req.params.id}:`, err);
    if (err.message.includes('Instructions must be') ||
        err.message.includes('Each step') ||
        err.message.includes('At least one') ||
        err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error updating recipe' });
  }
};

// DELETE a recipe (only by its author)
exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOneAndDelete({
      _id: req.params.id,
      authorId: req.user.id
    });

    if (!recipe) {
      return res
        .status(404)
        .json({ message: 'Recipe not found or you are unauthorized' });
    }
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    console.error(`Error deleting recipe ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error deleting recipe' });
  }
};

/**
 * POST  /api/recipes/:id/rate
 * Private – upsert a rating (1–5), recalc avg & count
 */
exports.rateRecipe = async (req, res) => {
  const { id: recipeId } = req.params;
  const { value }        = req.body;

  if (typeof value !== 'number' || value < 1 || value > 5) {
    return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
  }

  try {
    // Upsert the user’s rating
    await Rating.findOneAndUpdate(
      { user: req.user.id, recipe: new ObjectId(recipeId) },
      { value },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recalculate stats
    const agg = await Rating.aggregate([
      { $match: { recipe: new ObjectId(recipeId) } },
      {
        $group: {
          _id: '$recipe',
          count: { $sum: 1 },
          avg:   { $avg: '$value' }
        }
      }
    ]);

    const { count = 0, avg = 0 } = agg[0] || {};

    // Update Recipe doc
    await Recipe.findByIdAndUpdate(recipeId, {
      ratingCount: count,
      averageRating: avg
    });

    return res.json({
      ratingCount: count,
      averageRating: avg
    });
  } catch (err) {
    console.error('rateRecipe error:', err);
    return res.status(500).json({ message: 'Server error rating recipe' });
  }
};

/**
 * POST  /api/recipes/:id/like
 * Private – toggle a like, recalc total likes
 */
exports.likeRecipe = async (req, res) => {
  const { id: recipeId } = req.params;

  try {
    // Try to remove existing like
    const removed = await Like.findOneAndDelete({
      user: req.user.id,
      recipe: recipeId
    });

    let liked;
    if (removed) {
      liked = false;
    } else {
      // Create a new like
      await Like.create({ user: req.user.id, recipe: recipeId });
      liked = true;
    }

    // Count total likes
    const totalLikes = await Like.countDocuments({ recipe: recipeId });

    // Update Recipe doc
    await Recipe.findByIdAndUpdate(recipeId, { likeCount: totalLikes });

    return res.json({ liked, likeCount: totalLikes });
  } catch (err) {
    console.error('likeRecipe error:', err);
    return res.status(500).json({ message: 'Server error toggling like' });
  }
};
