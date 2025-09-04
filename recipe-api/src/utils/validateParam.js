// utils/validateParam.js
const mongoose  = require('mongoose');
const ApiError  = require('./ApiError');

/**
 * @param {string}   name       – the param name (e.g. 'id', 'commentId')
 * @param {Model}    [Model]    – optional mongoose model to load
 * @param {string}   [fields]   – optional .select() string
 * @param {string}   [attachAs] – req property to attach the doc (defaults to name)
 */
function validateParam(name, Model, fields = '', attachAs) {
  const key = attachAs || name;

  return async (req, res, next, value) => {
    // 1) Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return next(new ApiError(400, `Invalid ${name}`));
    }

    // 2) Load document if a Model was passed
    if (Model) {
      let doc;
      try {
        doc = await Model.findById(value).select(fields);
      } catch (err) {
        return next(err);
      }
      if (!doc) {
        return next(new ApiError(404, `${name} not found`));
      }
      req[key] = doc;
    } else {
      // for basic ID-only routes, you can still attach raw value
      req[key] = value;
    }

    next();
  };
}

module.exports = validateParam;


// const mongoose   = require('mongoose');
// const ApiError   = require('./ApiError');

// /**
//  * @param {string}   name     Param name (e.g. 'id', 'commentId')
//  * @param {Function} onValid  Optional: (req, value) => { … }
//  */
// function validateParam(name, onValid) {
//   return (req, res, next, value) => {
//     if (!mongoose.Types.ObjectId.isValid(value)) {
//       return next(new ApiError(400, `Invalid ${name}`));
//     }
//     if (onValid) {
//       try {
//         onValid(req, value);
//       } catch (err) {
//         return next(err);
//       }
//     }
//     next();
//   };
// }

// module.exports = validateParam;
