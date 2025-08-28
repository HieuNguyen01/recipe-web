// src/middleware/uploadAvatar.js
const multer = require('multer');

// store in memory so you can validate / transform before writing
const storage = multer.memoryStorage();  
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Not an image'), false);
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }  // 2MB max
});
