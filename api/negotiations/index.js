const { json, handleError, methodNotAllowed } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const prisma = require('../../lib/prisma');

// GET /api/negotiations — lista negociações do usuário logado
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const negotiations = await prisma.negotiation.findMany({
      where: { createdById: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        establishment: true,
        project: true,
        sale: true,
      },
    });
    return json(res, 200, { negotiations });
  } catch (err) { return handleError(res, err); }
};
