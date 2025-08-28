/**
 * Extracts a Base64 payload from a Data URI (or raw Base64 string)
 * and returns a Buffer.
 *
 * @param {string} image - Data URI (e.g. "data:image/png;base64,iVBORw0…")
 *                       or raw Base64 string.
 * @throws {Error} if the payload is not valid Base64.
 * @returns {Buffer}
 */
function toBuffer(image) {
  const match   = image.match(/^data:(.+);base64,(.*)$/);
  const payload = match ? match[2] : image;

  if (!/^[A-Za-z0-9+/=]+\s*$/.test(payload)) {
    throw new Error('Invalid Base64 payload');
  }

  return Buffer.from(payload, 'base64');
}
module.exports = { toBuffer };