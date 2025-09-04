// src/controllers/imageController.js
const fs       = require('fs');
const path     = require('path');
const Recipe   = require('../models/Recipe');
const ApiError = require('../utils/ApiError');
const { toBuffer } = require('../utils/imageBase64');
const catchAsync  = require('../utils/catchAsync');


// POST /api/recipe/:id/image
exports.createImage = catchAsync(async (req, res) => {
  const { recipe, body: { image } } = req;
  const userId = req.user.id;

  // Authorization
  if (recipe.authorId.toString() !== userId) {
    throw new ApiError(403, 'Forbidden');
  }

  // Decode Data URI
  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
  if (!match) {
    throw new ApiError(400, 'Invalid image data URI');
  }
  const mime = match[1];                      // e.g. 'image/png'
  const ext  = mime.split('/')[1] === 'svg+xml'
               ? 'svg'
               : mime.split('/')[1].replace('jpeg', 'jpg');
  const buffer = toBuffer(image);

  // Persist to disk
  const dir      = path.join(__dirname, '../../app/storage/avatar');
  const filename = `${recipe.id}.${ext}`;

  await fs.promises.mkdir(dir, { recursive: true });

  // Delete old avatar if it exists and is different from the new one
  if (recipe.image && recipe.image !== filename) {
    const oldPath = path.join(dir, recipe.image);
    await fs.promises.unlink(oldPath)
      .catch(err => {
        // ignore "file not found" but bubble up others
        if (err.code !== 'ENOENT') throw err;
      });
  }

  await fs.promises.writeFile(path.join(dir, filename), buffer);

  // Save filename in recipe.image
  recipe.image = filename;
  await recipe.save();

  res.json({ message: 'Image uploaded', image: filename });
});


// GET /api/recipe/:id/image
exports.getImage = catchAsync(async (req, res) => {
  const { recipe } = req;
  const filename = recipe.image;
  if (!filename) {
    throw new ApiError(404, 'No image uploaded');
  }

  const filePath = path.join(__dirname, '../../app/storage/avatar', filename);

  let buffer;
  try {
    buffer = await fs.promises.readFile(filePath);
  } catch {
    throw new ApiError(404, 'Image file not found');
  }

  const ext    = path.extname(filename).slice(1);
  const mime   = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;

  res.json({ image: dataUri });
});
