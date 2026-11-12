const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');

function one(v) { return Array.isArray(v) ? v[0] : v; }

const createSchema = z.object({
  name: z.string().min(2).max(180),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  company: z.string().max(180).optional(),
  status: z.enum(['novo', 'contato', 'qualificado', 'proposta', 'fechado', 'perdido']).optional().default('novo'),
  source: z.string().max(120).optional(),
  value: z.number().optional().default(0),
  note: z.string().max(4000).optional().default(''),
  lastContact: z.string().datetime().optional(),
});

const patchSchema = z.object({
  name: z.string().min(2).max(180).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  company: z.string().max(180).optional(),
  status: z.enum(['novo', 'contato', 'qualificado', 'proposta', 'fechado', 'perdido']).optional(),
  source: z.string().max(120).optional(),
  value: z.number().optional(),
  note: z.string().max(4000).optional(),
  lastContact: z.string().datetime().optional(),
});

function toClient(l) {
  return {
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    company: l.company,
    status: l.status,
    source: l.source,
    value: Number(l.value || 0),
    note: l.note,
    createdById: l.createdById,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
    lastContact: l.lastContact,
  };
}

async function loadScoped(user, id) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return { error: 404 };
  if (user.role !== 'admin' && lead.createdById !== user.id) return { error: 403 };
  return { lead };
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const isAdmin = user.role === 'admin';
    const rawId = one(req.query.id);
    const id = rawId ? String(rawId) : null;

    if (req.method === 'GET') {
      if (id) {
        const found = await loadScoped(user, id);
        if (found.error === 404) return json(res, 404, { error: 'Lead não encontrado' });
        if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
        return json(res, 200, { lead: toClient(found.lead) });
      }
      const where = isAdmin ? {} : { createdById: user.id };
      const leads = await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' } });
      return json(res, 200, { leads: leads.map(toClient) });
    }

    if (req.method === 'POST') {
      const body = createSchema.parse(await readJson(req));
      const lead = await prisma.lead.create({
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          company: body.company || null,
          status: body.status,
          source: body.source || null,
          value: body.value,
          note: body.note || null,
          lastContact: body.lastContact ? new Date(body.lastContact) : null,
          createdById: user.id,
        },
      });
      return json(res, 201, { lead: toClient(lead) });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Lead não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      const body = patchSchema.parse(await readJson(req));
      const data = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.email !== undefined) data.email = body.email;
      if (body.phone !== undefined) data.phone = body.phone;
      if (body.company !== undefined) data.company = body.company;
      if (body.status !== undefined) data.status = body.status;
      if (body.source !== undefined) data.source = body.source;
      if (body.value !== undefined) data.value = body.value;
      if (body.note !== undefined) data.note = body.note;
      if (body.lastContact !== undefined) data.lastContact = body.lastContact ? new Date(body.lastContact) : null;
      data.updatedAt = new Date();

      const lead = await prisma.lead.update({ where: { id }, data });
      return json(res, 200, { lead: toClient(lead) });
    }

    if (req.method === 'DELETE') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Lead não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      await prisma.lead.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};
