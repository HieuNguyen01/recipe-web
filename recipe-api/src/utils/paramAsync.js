module.exports = fn => (req, res, next, value) =>
  Promise.resolve(fn(req, res, next, value)).catch(next);
