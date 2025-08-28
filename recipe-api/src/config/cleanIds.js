module.exports = function cleanIds(schema) {
  // 1) Virtual id getter
  schema.virtual('id').get(function() {
    return this._id?.toString();
  });

  // 2) JSON transform
  const transform = (_doc, ret) => {
    ret.id = ret._id;   // rename
    delete ret._id;     // remove raw
    delete ret.__v;     // remove version key
    return ret;
  };

  schema.set('toJSON', {
    virtuals:     true,
    versionKey:   false,
    transform
  });

  schema.set('toObject', {
    virtuals:     true,
    versionKey:   false,
    transform
  });
};
