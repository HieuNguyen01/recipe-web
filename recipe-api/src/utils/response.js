exports.success = (res, message, data = null, meta = null) =>
  res.status(200).json({ success: true, message, data, meta });

exports.error = (res, status, message, code = null) =>
  res.status(status).json({ success: false, message, code });
