// routes/recipes.js

const express  = require('express');
const mongoose = require('mongoose');
const router   = express.Router();
const auth     = require('../middleware/auth');
const Recipe   = require('../models/Recipe');

/**
 * GET /api/recipes
 * Public – list all recipes
 */
router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    console.error('GET /recipes error:', err);
    res.status(500).json({ message: 'Server error fetching recipes' });
  }
});

/**
 * GET /api/recipes/search/name
 * Public – search by title substring
 * Query: ?title=...
 */
router.get('/search/name', async (req, res) => {
  const { title } = req.query;
  if (!title) {
    return res.status(400).json({ message: 'Missing title query parameter' });
  }

  try {
    const recipes = await Recipe.find({
      title: { $regex: title, $options: 'i' }
    });
    res.json(recipes);
  } catch (err) {
    console.error('GET /recipes/search/name error:', err);
    res.status(500).json({ message: 'Server error searching by name' });
  }
});

/**
 * GET /api/recipes/search/ingredients
 * Public – search by ingredients (AND-style)
 * Query: ?ingredients=egg,flour,sugar
 */
router.get('/search/ingredients', async (req, res) => {
  const { ingredients } = req.query;
  if (!ingredients) {
    return res.status(400).json({ message: 'Missing ingredients query parameter' });
  }

  const terms = ingredients
    .split(',')
    .map(str => str.trim())
    .filter(Boolean);

  const filter = {
    $and: terms.map(term => ({
      ingredients: {
        $elemMatch: { name: { $regex: term, $options: 'i' } }
      }
    }))
  };

  try {
    const recipes = await Recipe.find(filter);
    res.json(recipes);
  } catch (err) {
    console.error('GET /recipes/search/ingredients error:', err);
    res.status(500).json({ message: 'Server error searching by ingredients' });
  }
});

/**
 * POST /api/recipes
 * Private – create a new recipe
 */
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, imageUrl, ingredients, instructions } = req.body;
    const imageUrls = imageUrl ? [{ url: imageUrl }] : [];

    const recipe = new Recipe({
      title,
      description,
      imageUrls,
      ingredients,
      instructions,
      author: req.user
    });

    await recipe.save();
    res.status(201).json(recipe);
  } catch (err) {
    console.error('POST /recipes error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error creating recipe' });
  }
});

/**
 * PUT /api/recipes/:id
 * Private – update a recipe (author only)
 */
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid recipe ID' });
  }

  let {
    title,
    description,
    imageUrl,
    ingredients,
    instructions
  } = req.body;

  // ─── FIX: coerce an array into a newline-separated string ───
  if (Array.isArray(instructions)) {
    instructions = instructions.join('\n');
  }

  const updates = { title, description, ingredients, instructions };

  if (typeof imageUrl !== 'undefined') {
    updates.imageUrls = imageUrl
      ? [{ url: imageUrl }]
      : [];
  }

  try {
    const recipe = await Recipe.findOneAndUpdate(
      { _id: id, author: req.user },
      updates,
      { new: true, runValidators: true }
    );

    if (!recipe) {
      return res
        .status(404)
        .json({ message: 'Recipe not found or you’re not the author' });
    }

    res.json(recipe);
  } catch (err) {
    console.error(`PUT /recipes/${id} error:`, err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error updating recipe' });
  }
});

/**
 * DELETE /api/recipes/:id
 * Private – delete a recipe (author only)
 */
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid recipe ID' });
  }

  try {
    const recipe = await Recipe.findOneAndDelete({ _id: id, author: req.user });
    if (!recipe) {
      return res
        .status(404)
        .json({ message: 'Recipe not found or you’re not the author' });
    }
    res.json({ message: 'Recipe successfully deleted' });
  } catch (err) {
    console.error(`DELETE /recipes/${id} error:`, err);
    res.status(500).json({ message: 'Server error deleting recipe' });
  }
});

module.exports = router;
