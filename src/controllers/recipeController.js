// controllers/recipeControllers.js

const Recipe = require('../models/Recipe');

// CREATE a new recipe
exports.createRecipe = async (req, res) => {
  try {
    const { title, description, imageUrl, ingredients, instructions } = req.body;
    const imageUrls = imageUrl ? [{ url: imageUrl }] : [];

    const recipe = new Recipe({
      title,
      description,
      imageUrls,
      ingredients,
      instructions,
      author: req.user._id
    });

    await recipe.save();
    res.status(201).json(recipe);
  } catch (err) {
    console.error('Error creating recipe:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error creating recipe' });
  }
};

// GET all recipes (with optional title/ingredient regex filters)
exports.getRecipes = async (req, res) => {
  try {
    const { title, ingredient } = req.query;
    const filter = {};

    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }
    if (ingredient) {
      filter['ingredients.name'] = { $regex: ingredient, $options: 'i' };
    }

    const recipes = await Recipe.find(filter);
    res.json(recipes);
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ message: 'Server error fetching recipes' });
  }
};

// GET single recipe by ID
exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (err) {
    console.error(`Error fetching recipe ${req.params.id}:`, err);
    res.status(500).json({ message: 'Server error fetching recipe' });
  }
};

// UPDATE a recipe (only by its author)
exports.updateRecipe = async (req, res) => {
  try {
    const { title, description, imageUrl, ingredients, instructions } = req.body;
    const updates = { title, description, ingredients, instructions };

    if (typeof imageUrl !== 'undefined') {
      updates.imageUrls = imageUrl ? [{ url: imageUrl }] : [];
    }

    const recipe = await Recipe.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!recipe) {
      return res
        .status(404)
        .json({ message: 'Recipe not found or you are unauthorized' });
    }
    res.json(recipe);
  } catch (err) {
    console.error(`Error updating recipe ${req.params.id}:`, err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error updating recipe' });
  }
};

// DELETE a recipe (only by its author)
exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id
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
