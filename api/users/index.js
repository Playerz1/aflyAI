const { json, handleError, methodNotAllowed, readJson } = require('../../lib/http');
const { requireAdmin } = require('../../lib/auth');
const prisma = require('../../lib/prisma');
const { z } = require('zod');

// GET /api/users — lista todos (apenas admin)
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;
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
