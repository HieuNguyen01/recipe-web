// models/Like.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const likeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipe: {
    type: Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  }
},
{
  timestamps: true
});

// One like per user per recipe
likeSchema.index({ user: 1, recipe: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
