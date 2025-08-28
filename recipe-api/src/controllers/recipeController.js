const mongoose = require('mongoose');
const { ObjectId } = mongoose.mongo;
const Recipe = require('../models/Recipe');
const Rating = require('../models/Rating');
const ApiError  = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

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
  // req.body is already validated & stripped by validateBody
  const {
    title, description, cookingTime,
    ingredients, instructions, image
  } = req.body;

  const cleanInstructions = normalizeSteps(instructions);
  const recipe = await Recipe.create({
    title, description,
    cookingTime,
    ingredients,
    instructions: cleanInstructions,
    image,
    authorId: req.user.id
  });

  return res.status(201).json(recipe);
};

// GET all recipes with optional title/ingredient filters + pagination
exports.getRecipes = async (req, res) => {
  try {
    // extract only the search params
    const { title, ingredient } = req.query;
    const searchTerm = (title || ingredient || '').trim();
    const filter = {};

    // build text‐search filter if needed
    if (searchTerm) {
      const tokens = searchTerm.split(/\s+/);
      filter.$or = tokens.flatMap(token => [
        { title: { $regex: token, $options: 'i' } },
        { 'ingredients.name': { $regex: token, $options: 'i' } }
      ]);
    }

    // fetch all matching recipes (no skip/limit)
    const docs = await Recipe.find(filter)
      .populate('authorId', 'name')
      .sort({ createdAt: -1 });

    // map to response shape
    const currentUserId = req.user?._id.toString();
    const recipes = docs.map(doc => {
      const r = doc.toObject();
      return {
        id:           r.id,
        title:        r.title,
        image:        r.image,
        author:       r.authorId?.name || 'Unknown author',
        rating:       r.averageRating,
        editable:     currentUserId === r.authorId?._id.toString(),
        description:  r.description,
        cookingTime:  r.cookingTime,
        ingredients:  r.ingredients,
        instructions: r.instructions,
        likeCount:    r.likeCount,
        ratingCount:  r.ratingCount,
        comments:     r.comments,
        createdAt:    r.createdAt,
        updatedAt:    r.updatedAt
      };
    });

    // return full list; client handles slicing
    return res.json({ recipes });

  } catch (err) {
    console.error('Error fetching recipes:', err);
    return res.status(500).json({ message: 'Server error fetching recipes' });
  }
};

// GET single recipe by ID
exports.getRecipeById = catchAsync(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id)
    .populate('authorId', 'name')
    .populate({
      path: 'comments',
      options: { sort: { createdAt: -1 } },
      populate: { path: 'authorId', select: 'name' }
    })
    .populate('likeCount');
  if (!recipe) {
    throw new ApiError(404, 'Recipe not found');
  }
  // calls schema.toObject() + cleanIds transform
  const clean = recipe.toObject(); 
  clean.comments = clean.comments.map((c) => {
    c.author = c.authorId;
    delete c.authorId;
    return c;
  });

  res.json(clean);
});

// UPDATE a recipe (only by its author)
exports.updateRecipe = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // 1) Existence check
  const recipe = await Recipe.findById(id);
  if (!recipe) {
    throw new ApiError(404, 'Recipe not found');
  }

  // 2) Authorization check
  if (recipe.authorId.toString() !== userId) {
    throw new ApiError(403, 'You are not allowed to edit this recipe');
  }

  // 3) Apply only the fields that came in
  const { title, description, cookingTime, ingredients, instructions, image } = req.body;
  if (title       !== undefined) recipe.title       = title;
  if (description !== undefined) recipe.description = description;
  if (cookingTime !== undefined) recipe.cookingTime = cookingTime;
  if (ingredients !== undefined) recipe.ingredients = ingredients;
  if (instructions !== undefined) recipe.instructions = normalizeSteps(instructions);
  if (image       !== undefined) recipe.image       = image;

  // 4) Save
  await recipe.save();
  res.json(recipe);
});

// DELETE a recipe (only by its author)
exports.deleteRecipe = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // 1) Existence check
  const recipe = await Recipe.findById(id);
  if (!recipe) {
    throw new ApiError(404, 'Recipe not found');
  }

  // 2) Authorization check
  if (recipe.authorId.toString() !== userId) {
    throw new ApiError(403, 'You are not allowed to delete this recipe');
  }

  // 3) Delete
  await recipe.deleteOne();
  res.status(204).end();
});
