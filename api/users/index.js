const { json, handleError, methodNotAllowed, readJson } = require('../../lib/http');
const { requireAdmin, requireAuth } = require('../../lib/auth');
const prisma = require('../../lib/prisma');
const { z } = require('zod');

// GET /api/users — lista todos (apenas admin) ou próprio usuário
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    // GET /api/users/me — dados do usuário logado
    const url = req.url || '';
    if (url.includes('/me') || req.query.me) {
      const meUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!meUser) return json(res, 404, { error: 'Usuário não encontrado' });
      return json(res, 200, {
        user: {
          id: meUser.id,
          email: meUser.email,
          nome: meUser.name,
          iniciais: meUser.initials,
          role: meUser.role,
          status: meUser.status,
          plano: meUser.plan,
          avatar: meUser.avatar,
        },
      });
    }

    // Admin vê todos, usuário comum vê apenas a si mesmo
    if (user.role !== 'admin') {
      const me = await prisma.user.findUnique({ where: { id: user.id } });
      if (!me) return json(res, 404, { error: 'Usuário não encontrado' });
      return json(res, 200, {
        users: [{
          id: me.id,
          email: me.email,
          name: me.name,
          role: me.role,
          status: me.status,
          plan: me.plan,
          avatar: me.avatar,
          createdAt: me.createdAt,
          lastLoginAt: me.lastLoginAt,
        }],
      });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, role: true, status: true, plan: true, avatar: true, createdAt: true, lastLoginAt: true },
    });
    return json(res, 200, { users });
  } catch (err) { return handleError(res, err); }
};

// PATCH /api/users/:id — atualiza usuário (apenas admin)
const patchSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'member']).optional(),
  status: z.enum(['active', 'blocked', 'invite']).optional(),
  plano: z.string().optional(),
  avatar: z.string().optional().nullable(),
});

module.exports.patch = async function handlerPatch(req, res) {
  if (req.method !== 'PATCH') return methodNotAllowed(res, ['PATCH']);
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = req.query.id;
    if (!id) return json(res, 400, { error: 'ID do usuário não informado' });
    const body = patchSchema.parse(await readJson(req));
    const existente = await prisma.user.findUnique({ where: { id } });
    if (!existente) return json(res, 404, { error: 'Usuário não encontrado' });
    const atualizado = await prisma.user.update({ where: { id }, data: body });
    return json(res, 200, { user: atualizado });
  } catch (err) { return handleError(res, err); }
};
