const Yup = require('yup');

const addCommentSchema = Yup.object({
  content: Yup.string()
              .trim()
              .required('Comment content is required')
});

module.exports = { addCommentSchema };
