const mongoose = require('mongoose');

const URL_REGEX = /^https?:\/\/.+\..+$/;

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    // Allow exactly one image URL, with basic format validation
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
      validate: {
        validator: arr => arr.length <= 1,
        message: 'You can only add one image'
      }
    },
    ingredients: [
      {
        name:   { type: String, required: true },
        amount: { type: String, required: true }
      }
    ],
    instructions: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes to speed up title/ingredient lookups
recipeSchema.index({ title: 1 });
recipeSchema.index({ 'ingredients.name': 1 });

module.exports = mongoose.model('Recipe', recipeSchema);
