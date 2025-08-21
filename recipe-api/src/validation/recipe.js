const Yup = require('yup');
const { validUnits } = require('../models/Recipe');

const ingredientSchema = Yup.object({
  name:   Yup.string().required('Ingredient name is required'),
  amount: Yup.number()
             .min(0.01, 'Amount must be positive')
             .required('Amount is required'),
  unit:   Yup.string()
             .oneOf(validUnits, 'Invalid unit')
             .required('Unit is required')
});

const createRecipeSchema = Yup.object({
  title:        Yup.string().required('Title is required'),
  description:  Yup.string().nullable(),
  cookingTime:  Yup.number()
                  .min(1, 'Cooking time must be at least 1 minute')
                  .required('Cooking time is required'),
  ingredients:  Yup.array()
                  .of(ingredientSchema)
                  .min(1, 'At least one ingredient is required'),
  instructions: Yup.array()
                  .of(Yup.string().required('Instruction step is required'))
                  .min(1, 'At least one instruction step is required'),
  image:        Yup.string()
                  .matches(
                    /^data:image\/(png|jpeg|jpg|gif);base64,/,
                    'Image must be a valid data URI'
                  )
                  .optional()
});

const updateRecipeSchema = createRecipeSchema
  .noUnknown()
  .partial(); // make all fields optional but still validated if present

module.exports = { createRecipeSchema, updateRecipeSchema };
