// routes/comment.js
const express       = require('express');
const { addComment, getAllComments, updateComment, deleteComment } = require('../controllers/commentController');
const validateBody  = require('../middleware/validateBody');
const { addCommentSchema } = require('../validation/comment');
const auth          = require('../middleware/auth');
const validateParam = require('../utils/validateParam');
const Comment       = require('../models/Comment');

const router = express.Router({ mergeParams: true });

// Validate commentId whenever it appears in the URL
router.param('commentId', validateParam('commentId', Comment, 'authorId content', 'comment'));

// GET  /api/recipe/:id/comment
router.get(
  '/',
  getAllComments
);

// POST /api/recipe/:id/comment
router.post(
  '/',
  auth,
  validateBody(addCommentSchema),
  addComment
);

// PUT  /api/recipe/:id/comment/:commentId
router.put(
  '/:commentId',
  auth,
  validateBody(addCommentSchema),
  updateComment
);

// DELETE /api/recipe/:id/comment/:commentId
router.delete(
  '/:commentId',
  auth,
  deleteComment
);

module.exports = router;
