// models/Rating.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ratingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipeId: {
    type: Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0.5,
    max: 5,
    validate: {
      validator: v => (v * 2) % 1 === 0,
      message: 'Rating must be in 0.5 increments'
    }
  }
},
{
  timestamps: true
});

// Ensure one rating per user per recipe
ratingSchema.index({ user: 1, recipeId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
