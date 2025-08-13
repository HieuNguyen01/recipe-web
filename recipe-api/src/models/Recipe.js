// models/Recipe.js
const mongoose = require('mongoose');

const URL_REGEX = /^(https?:\/\/)([\w\-_]+(\.[\w\-_]+)+)([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?$/i;
const validUnits = [ 'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'piece' ];

// Ingredient sub‐document (no own _id)
const ingredientSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: [0.01, 'Amount must be a positive number'] },
  unit:   { type: String, required: true, enum: validUnits }
}, { _id: false });

// Main Recipe schema
const recipeSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  description:   { type: String, trim: true },
  cookingTime:   { type: Number, required: true, min: [1, 'Cooking time must be at least 1 minute'] },
  ingredients:   [ ingredientSchema ],
  instructions:  {
    type: [String],
    default: [],
    validate: {
      validator: arr => arr.every(s => typeof s === 'string' && s.trim().length > 0),
      message: 'Each instruction must be a nonempty string.'
    }
  },
  image: {
    type: String,
    // validate: {
    //   validator: url => URL_REGEX.test(url),
    //   message: props => `${props.value} is not a valid URL`
    // }
  },
  authorId:       { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  averageRating:  { type: Number, default: 0, min: 0, max: 5 },
  ratingCount:    { type: Number, default: 0, min: 0 },
  likes:          [ { type: mongoose.Types.ObjectId, ref: 'User' } ]
}, {
  timestamps: true,
  toJSON:    { virtuals: true },
  toObject:  { virtuals: true }
});

// Virtual for full comment docs
recipeSchema.virtual('comments', {
  ref: 'Comment', localField: '_id',
  foreignField: 'recipe', justOne: false
});
// Virtual for like count only
recipeSchema.virtual('likeCount', {
  ref: 'Like', localField: '_id',
  foreignField: 'recipe', count: true
});

// Expose `id` as a hex‐string virtual (for lean queries with { virtuals: true })
recipeSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Recipe', recipeSchema);
module.exports.validUnits = validUnits;
