const mongoose = require('mongoose');
const { Schema } = mongoose;

const URL_REGEX = /^https?:\/\/.+\..+$/;
const validUnits = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece'];

const ingredientSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be a positive number']
  },
  unit: {
  type: String,
  required: true,
  enum: validUnits
}
}, { _id: true });

const recipeSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  cookingTime: {
    type: Number,
    required: true,
    min: [1, 'Cooking time must be at least 1 minute']
  },
  ingredients: {
    type: [ingredientSchema],
    validate: [
      {
        validator: arr => arr.length > 0,
        message: 'At least one ingredient is required'
      },
      {
        validator: arr => {
          const names = arr.map(i => i.name.toLowerCase());
          return new Set(names).size === names.length;
        },
        message: 'Duplicate ingredient names are not allowed'
      }
    ]
  },
  instructions: {
    type: [String],
    default: [],
    validate: {
      validator: arr => arr.every(s => typeof s === 'string' && s.trim().length > 0),
      message: 'Each instruction must be a nonempty string.'
    }
  },
  imageUrls: {
    type: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
          match: [URL_REGEX, 'Invalid URL format']
        }
      }
    ],
    default: [],
    // Allow only one image URL, basic format validation
    validate: {
      validator: arr => arr.length <= 1,
      message: 'You can only add one image'
    }
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  }
},
{
  timestamps: true
});

// Indexes for faster lookups
recipeSchema.index({ title: 1 });
recipeSchema.index({ 'ingredients.name': 1 });

module.exports = mongoose.model('Recipe', recipeSchema);