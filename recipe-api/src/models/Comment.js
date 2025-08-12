const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  content: { type: String, required: true, trim: true },
  createdAt:{ type: Date, default: Date.now, index: true}
}
);

module.exports = mongoose.model('Comment', commentSchema);
