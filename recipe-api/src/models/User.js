const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    }
    //which recipes this user has liked
    // likedRecipes: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Recipe'
    //   }
    // ],
    // //which recipes this user has rated (and their rating)
    // ratedRecipes: [
    //   {
    //     recipe: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: 'Recipe'
    //     },
    //     value: {
    //       type: Number,
    //       min: 1,
    //       max: 5
    //     }
    //   }
    // ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
