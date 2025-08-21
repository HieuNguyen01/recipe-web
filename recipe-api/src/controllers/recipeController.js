const mongoose = require('mongoose');
const { ObjectId } = mongoose.mongo;
const fs     = require('fs');
const path   = require('path');
const Recipe = require('../models/Recipe');
const Rating = require('../models/Rating');
const Like   = require('../models/Like');
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
// controllers/recipeController.js
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
        { title:            { $regex: token,            $options: 'i' } },
        { 'ingredients.name': { $regex: token,          $options: 'i' } }
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
    .populate('likeCount')
    .lean({ virtuals: true });

  if (!recipe) {
    throw new ApiError(404, 'Recipe not found');
  }

  recipe.comments = recipe.comments.map((c) => {
    c.author = c.authorId;
    delete c.authorId;
    return c;
  });

  res.json(recipe);
});

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
  const recipeId = req.params.id;
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

    return res.json({ liked, likeCount: await Like.countDocuments({ recipe: recipeId }) });

  } catch (err) {
    console.error('likeRecipe error:', err);
    return res.status(500).json({ message: 'Server error toggling like' });
  }
};

// helper to pull out the real base64 payload
function toBuffer(image) {
  // If it’s a data URI, strip the prefix
  const match = image.match(/^data:(.+);base64,(.*)$/);
  const payload = match ? match[2] : image;

  // Ensure it’s valid Base64 (simple check)
  if (!/^[A-Za-z0-9+/=]+\s*$/.test(payload)) {
    throw new Error('Invalid Base64 payload');
  }
  return Buffer.from(payload, 'base64');
}

// POST /api/recipe/:id/avatar
exports.createAvatar = async (req, res) => {
  try {
    // Fetch + authorize
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    if (recipe.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Validate data-URI format
    const { image } = req.body;
    if (
      typeof image !== 'string' ||
      !image.startsWith('data:image/') ||
      !image.includes(';base64,')
    ) {
      return res.status(400).json({ message: 'Invalid image data' });
    }

    // Parse out MIME + Base64 payload
    const [meta, base64] = image.split(';base64,');
    const mimeMatch = meta.match(/^data:(image\/[a-zA-Z0-9.+-]+)/);
    if (!mimeMatch) {
      return res.status(400).json({ message: 'Unsupported image MIME type' });
    }
    const mimeType = mimeMatch[1];                  // e.g. "image/png"
    const ext      = mimeType.split('/')[1] === 'jpeg' 
                     ? 'jpg' 
                     : mimeType.split('/')[1];     // normalize "jpeg" → "jpg"

    // Decode & write file
    let buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch (err) {
      return res.status(400).json({ message: 'Corrupt Base64 payload' });
    }

    const dir      = path.join(__dirname, '../../app/storage/avatar');
    const filename = `${req.params.id}.${ext}`;
    const filePath = path.join(dir, filename);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, buffer);

    // Echo back the data-URI
    return res.status(200).json({
      message: 'Avatar uploaded',
      avatar: image
    });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/recipe/:id/avatar
// exports.getAvatar = async (req, res) => {
//   try {
//     // Build path to expected avatar
//     const filePath = path.join( __dirname, '../../app/storage/avatar', `${req.params.id}.jpg`);

//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ message: 'Avatar not found' });
//     }

//     // Read file, convert to Base64 and return as JSON
//     const buffer = fs.readFileSync(filePath);
//     const base64 = buffer.toString('base64');
//     const dataUrl = `data:image/jpeg;base64,${base64}`;

//     // Stream the file with correct header
//     // res.setHeader('Content-Type', 'image/jpeg');
//     return res.json({ avatar: dataUrl });
//   } catch (err) {
//     console.error('Error fetching avatar:', err);
//     return res.status(500).json({ message: 'Server error fetching avatar' });
//   }
// };