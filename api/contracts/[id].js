const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');

function one(v) { return Array.isArray(v) ? v[0] : v; }

const patchSchema = z.object({
  clientName: z.string().min(2).max(180).optional(),
  clientEmail: z.string().email().optional(),
  service: z.string().min(2).max(180).optional(),
  value: z.number().optional(),
  status: z.enum(['rascunho', 'ativo', 'vencido', 'cancelado']).optional(),
  signedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  leadId: z.string().optional(),
});

function toClient(c) {
  return {
    id: c.id, clientName: c.clientName, clientEmail: c.clientEmail, service: c.service,
    value: Number(c.value || 0), status: c.status, signedAt: c.signedAt, expiresAt: c.expiresAt,
    leadId: c.leadId, createdById: c.createdById, createdAt: c.createdAt, updatedAt: c.updatedAt,
  };
}

function getIdFromUrl(url) {
  const m = (url || '').match(/\/api\/contracts\/([^\/]+)(\?.*)?$/);
  return m ? m[1] : null;
}

async function loadScoped(user, id) {
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) return { error: 404 };
  if (user.role !== 'admin' && contract.createdById !== user.id) return { error: 403 };
  return { contract };
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = getIdFromUrl(req.url);
    if (!id) return json(res, 400, { error: 'ID inválido' });

    if (req.method === 'GET') {
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Contrato não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
      return json(res, 200, { contract: toClient(found.contract) });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Contrato não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
      const body = patchSchema.parse(await readJson(req));
      const data = {};
      if (body.clientName !== undefined) data.clientName = body.clientName;
      if (body.clientEmail !== undefined) data.clientEmail = body.clientEmail;
      if (body.service !== undefined) data.service = body.service;
      if (body.value !== undefined) data.value = body.value;
      if (body.status !== undefined) data.status = body.status;
      if (body.signedAt !== undefined) data.signedAt = body.signedAt ? new Date(body.signedAt) : null;
      if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
      if (body.leadId !== undefined) data.leadId = body.leadId;
      data.updatedAt = new Date();
      const contract = await prisma.contract.update({ where: { id }, data });
      return json(res, 200, { contract: toClient(contract) });
    }

    if (req.method === 'DELETE') {
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Contrato não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
      await prisma.contract.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};
