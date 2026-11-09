const bcrypt = require('bcryptjs');
const prisma = require('../../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, safeUser, z } = require('../../../lib/http');
const { requireAdmin } = require('../../../lib/auth');

function initials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(6).max(200).optional(),
  plan: z.string().max(40).optional(),
  role: z.enum(['admin', 'member', 'client']).optional(),
  status: z.enum(['active', 'invite', 'blocked']).optional(),
  jobTitle: z.string().max(120).optional(),
  note: z.string().max(2000).nullable().optional(),
});

module.exports = async function handler(req, res) {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = req.query.id;
    if (!id || typeof id !== 'string') return json(res, 400, { error: 'ID inválido' });

    if (req.method === 'GET') {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return json(res, 404, { error: 'Usuário não encontrado' });
      return json(res, 200, { user: safeUser(user) });
    }

    if (req.method === 'PATCH') {
      const body = patchSchema.parse(await readJson(req));
      const data = {};
      if (body.name !== undefined) { data.name = body.name.trim(); data.initials = initials(body.name); }
      if (body.email !== undefined) data.email = body.email.toLowerCase();
      if (body.plan !== undefined) data.plan = body.plan;
      if (body.role !== undefined) data.role = body.role;
      if (body.status !== undefined) data.status = body.status;
      if (body.jobTitle !== undefined) data.jobTitle = body.jobTitle;
      if (body.note !== undefined) data.note = body.note;
      if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);
      // prevent locking out the primary admin by self-demote in common case
      if (id === admin.id && data.role && data.role !== 'admin') return json(res, 400, { error: 'Não é possível remover seu próprio acesso admin' });
      if (id === admin.id && data.status === 'blocked') return json(res, 400, { error: 'Não é possível bloquear seu próprio acesso' });
      const user = await prisma.user.update({ where: { id }, data });
      return json(res, 200, { user: safeUser(user) });
    }

    if (req.method === 'DELETE') {
      if (id === admin.id) return json(res, 400, { error: 'Não é possível excluir seu próprio usuário' });
      await prisma.user.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'PATCH', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};
