const { json, handleError, methodNotAllowed, clearCookie } = require('../../lib/http');
const { COOKIE } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    clearCookie(res, COOKIE);
    return json(res, 200, { ok: true });
  } catch (err) { return handleError(res, err); }
};
