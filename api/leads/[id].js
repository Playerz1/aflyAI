const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');

function one(v) { return Array.isArray(v) ? v[0] : v; }

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
    id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company,
    status: l.status, source: l.source, value: Number(l.value || 0), note: l.note,
    createdById: l.createdById, createdAt: l.createdAt, updatedAt: l.updatedAt, lastContact: l.lastContact,
  };
}

function getIdFromUrl(url) {
  const m = (url || '').match(/\/api\/leads\/([^\/]+)(\?.*)?$/);
  return m ? m[1] : null;
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
    const id = getIdFromUrl(req.url);
    if (!id) return json(res, 400, { error: 'ID inválido' });

    if (req.method === 'GET') {
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Lead não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
      return json(res, 200, { lead: toClient(found.lead) });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
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
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Lead não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
      await prisma.lead.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};
