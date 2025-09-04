// src/validation/image.js
const Yup = require('yup');

const uploadImageSchema = Yup.object({
  image: Yup.string()
    .matches(
      /^data:image\/(png|jpe?g|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/,
      'Image must be a valid data URI'
    )
    .required('Image data URI is required')
});

module.exports = { uploadImageSchema };
