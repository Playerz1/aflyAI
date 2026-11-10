const bcrypt = require('bcryptjs');
const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, safeUser, z } = require('../../lib/http');
const { requireAdmin, setSessionCookie } = require('../../lib/auth');

function initials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

// Função única para o recurso de usuários (limite de 12 funções do plano Hobby):
//   GET    /api/users            -> lista
//   GET    /api/users?id=...     -> um usuário
//   POST   /api/users            -> admin cria
//   POST   /api/users?action=signup -> cadastro público
//   PATCH  /api/users?id=...     -> admin atualiza
//   DELETE /api/users?id=...     -> admin remove
function one(v) { return Array.isArray(v) ? v[0] : v; }

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(6).max(200).optional(),
  plan: z.string().max(40).optional().default('Pro'),
  role: z.enum(['admin', 'member', 'client']).optional().default('member'),
  status: z.enum(['active', 'invite', 'blocked']).optional().default('invite'),
  jobTitle: z.string().max(120).optional().default(''),
  note: z.string().max(2000).nullable().optional(),
});

const signupSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(6).max(200),
  plan: z.string().max(40).optional().default('Pro'),
});

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

async function handleSignup(req, res) {
  const body = signupSchema.parse(await readJson(req));
  const email = body.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return json(res, 409, { error: 'E-mail já cadastrado' });
  const user = await prisma.user.create({
    data: {
      name: body.name.trim(),
      initials: initials(body.name),
      email,
      plan: body.plan || 'Pro',
      role: 'member',
      status: 'active',
      jobTitle: 'Usuário',
      passwordHash: await bcrypt.hash(body.password, 12),
    },
  });
  setSessionCookie(res, user);
  return json(res, 201, { user: safeUser(user) });
}

module.exports = async function handler(req, res) {
  try {
    const action = one(req.query.action || req.query.a);
    if (req.method === 'POST' && action === 'signup') return handleSignup(req, res);

    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = one(req.query.id);

    if (req.method === 'GET') {
      if (id) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return json(res, 404, { error: 'Usuário não encontrado' });
        return json(res, 200, { user: safeUser(user) });
      }
      const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
      return json(res, 200, { users: users.map(safeUser) });
    }

    if (req.method === 'POST') {
      const body = createSchema.parse(await readJson(req));
      const data = {
        name: body.name.trim(),
        initials: initials(body.name),
        email: body.email.toLowerCase(),
        plan: body.plan,
        role: body.role,
        status: body.status,
        jobTitle: body.jobTitle || '',
      };
      if (body.note !== undefined) data.note = body.note;
      if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);
      const user = await prisma.user.create({ data });
      return json(res, 201, { user: safeUser(user) });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
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
      if (id === admin.id && data.role && data.role !== 'admin') return json(res, 400, { error: 'Não é possível remover seu próprio acesso admin' });
      if (id === admin.id && data.status === 'blocked') return json(res, 400, { error: 'Não é possível bloquear seu próprio acesso' });
      const user = await prisma.user.update({ where: { id }, data });
      return json(res, 200, { user: safeUser(user) });
    }

    if (req.method === 'DELETE') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      if (id === admin.id) return json(res, 400, { error: 'Não é possível excluir seu próprio usuário' });
      await prisma.user.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};
