// models/Rating.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ratingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipe: {
    type: Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
},
{
  timestamps: true
});

// Ensure one rating per user per recipe
ratingSchema.index({ user: 1, recipe: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
