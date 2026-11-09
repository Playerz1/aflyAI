const { json, handleError, methodNotAllowed, safeUser } = require('../../lib/http');
const { getSessionUser } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const user = await getSessionUser(req);
    if (!user) return json(res, 200, { user: null });
    return json(res, 200, { user: safeUser(user) });
  } catch (err) { return handleError(res, err); }
};
