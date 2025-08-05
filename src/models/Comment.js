const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  content: { type: String, required: true, maxlength: 1000 }
},
{
  timestamps: true
}
);

module.exports = mongoose.model('Comment', commentSchema);
