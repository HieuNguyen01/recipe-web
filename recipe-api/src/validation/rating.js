const Yup = require('yup');

const rateRecipeSchema = Yup.object({
  value: Yup.number()
    .required('Rating is required')
    .min(0.5, 'Minimum rating is 0.5')
    .max(5, 'Maximum rating is 5')
    .test(
      'half-step',
      'Rating must be in 0.5 increments',
      v => Number.isFinite(v) && (v * 2) % 1 === 0
    )
});

module.exports = { rateRecipeSchema };
