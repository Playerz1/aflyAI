const { json, handleError, methodNotAllowed } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const prisma = require('../../lib/prisma');

// GET /api/users/me — dados do usuário logado
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const user = await requireAuth(req, res);
    if (!user) return json(res, 200, { user: null });
    return json(res, 200, { user: { id: user.id, email: user.email, nome: user.name, iniciais: user.initials, role: user.role, status: user.status, plano: user.plan, avatar: user.avatar } });
  } catch (err) { return handleError(res, err); }
};
