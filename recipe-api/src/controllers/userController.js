// controllers/userController.js

const User    = require('../models/User');
const Like    = require('../models/Like');
const Comment = require('../models/Comment');

/**
 * GET /users
 * Public – list all users (no passwords)
 */
async function getAllUsers(req, res) {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json(users);
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({ message: 'Server error fetching users' });
  }
}

/**
 * GET /users/:id
 * Public – get a single user by ID (no password)
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res
        .status(404)
        .json({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error(`getUserById error (id=${req.params.id}):`, err);
    return res.status(500).json({ message: 'Server error fetching user' });
  }
}

/**
 * GET /users/me
 * Private – return the profile of the logged-in user
 */
async function getMe(req, res) {
  try {
    // auth middleware has already fetched the user and attached to req.user
    return res.status(200).json(req.user);
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * GET /users/:id/likes
 * Public – paginated list of recipes this user has liked
 */
async function getLikes(req, res) {
  const { id } = req.params;
  const page  = Math.max(parseInt(req.query.page)  || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip  = (page - 1) * limit;

  try {
    // ensure user exists
    const userExists = await User.exists({ _id: id });
    if (!userExists) {
      return res
        .status(404)
        .json({ code: 'USER_NOT_FOUND', message: 'No user with given ID' });
    }

    const total = await Like.countDocuments({ user: id });
    const likes = await Like.find({ user: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'recipe',
        select: 'title author cookingTime imageUrl',
        populate: { path: 'author', select: 'username' }
      });

    const data = likes.map(like => ({
      recipeId:    like.recipe._id,
      title:       like.recipe.title,
      author:      { id: like.recipe.author._id, username: like.recipe.author.username },
      cookingTime: like.recipe.cookingTime,
      imageUrl:    like.recipe.imageUrl,
      likedAt:     like.createdAt.toISOString()
    }));

    return res.status(200).json({
      meta: { total, page, limit },
      data
    });
  } catch (err) {
    console.error('getLikes error:', err);
    return res.status(500).json({ message: 'Server error fetching likes' });
  }
}

/**
 * GET /users/:id/comments
 * Public – paginated list of comments authored by this user
 */
async function getComments(req, res) {
  const { id } = req.params;
  const page  = Math.max(parseInt(req.query.page)  || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip  = (page - 1) * limit;

  try {
    // ensure user exists
    const userExists = await User.exists({ _id: id });
    if (!userExists) {
      return res
        .status(404)
        .json({ code: 'USER_NOT_FOUND', message: 'No user with given ID' });
    }

    const total    = await Comment.countDocuments({ author: id });
    const comments = await Comment.find({ author: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'recipe', select: 'title' });

    const data = comments.map(c => ({
      commentId: c._id,
      recipe:    { id: c.recipe._id, title: c.recipe.title },
      content:   c.content,
      createdAt: c.createdAt.toISOString(),
      // updatedAt: c.updatedAt.toISOString()
    }));

    return res.status(200).json({
      meta: { total, page, limit },
      data
    });
  } catch (err) {
    console.error('getComments error:', err);
    return res.status(500).json({ message: 'Server error fetching comments' });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  getMe,
  getLikes,
  getComments
};



// const User = require('../models/User');

// exports.getAllUsers = async (req, res, next) => {
//   try {
//     const users = await User.find().select('-password');
//     res.status(200).json(users);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getUserById = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.params.id).select('-password');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.status(200).json(user);
//   } catch (err) {
//     next(err);
//   }
// };
