const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');

function one(v) { return Array.isArray(v) ? v[0] : v; }

const createSchema = z.object({
  type: z.enum([
    'lead_created', 'lead_contacted', 'lead_qualified', 'contract_created', 'contract_signed',
    'payment_received', 'payment_overdue', 'site_published', 'user_created', 'user_blocked',
    'ticket_created', 'ticket_resolved',
  ]),
  title: z.string().min(2).max(180),
  description: z.string().max(4000).optional(),
  userId: z.string().optional(),
  leadId: z.string().optional(),
  contractId: z.string().optional(),
  siteId: z.string().optional(),
});

const patchSchema = z.object({
  type: z.enum([
    'lead_created', 'lead_contacted', 'lead_qualified', 'contract_created', 'contract_signed',
    'payment_received', 'payment_overdue', 'site_published', 'user_created', 'user_blocked',
    'ticket_created', 'ticket_resolved',
  ]).optional(),
  title: z.string().min(2).max(180).optional(),
  description: z.string().max(4000).optional(),
  userId: z.string().optional(),
  leadId: z.string().optional(),
  contractId: z.string().optional(),
  siteId: z.string().optional(),
});

function toClient(a) {
  return {
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    userId: a.userId,
    leadId: a.leadId,
    contractId: a.contractId,
    siteId: a.siteId,
    createdAt: a.createdAt,
  };
}

async function loadScoped(user, id) {
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) return { error: 404 };
  if (user.role !== 'admin' && activity.userId !== user.id) return { error: 403 };
  return { activity };
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
        if (found.error === 404) return json(res, 404, { error: 'Atividade não encontrada' });
        if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
        return json(res, 200, { activity: toClient(found.activity) });
      }
      const where = isAdmin ? {} : { userId: user.id };
      const activities = await prisma.activity.findMany({
        where,
        include: {
          lead: { select: { id: true, name: true } },
          contract: { select: { id: true, clientName: true } },
          site: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return json(res, 200, { activities: activities.map(a => ({ ...toClient(a), lead: a.lead, contract: a.contract, site: a.site })) });
    }

    if (req.method === 'POST') {
      const body = createSchema.parse(await readJson(req));
      const activity = await prisma.activity.create({
        data: {
          type: body.type,
          title: body.title,
          description: body.description || null,
          userId: body.userId || user.id,
          leadId: body.leadId || null,
          contractId: body.contractId || null,
          siteId: body.siteId || null,
        },
      });
      return json(res, 201, { activity: toClient(activity) });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Atividade não encontrada' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      const body = patchSchema.parse(await readJson(req));
      const data = {};
      if (body.type !== undefined) data.type = body.type;
      if (body.title !== undefined) data.title = body.title;
      if (body.description !== undefined) data.description = body.description;
      if (body.userId !== undefined) data.userId = body.userId;
      if (body.leadId !== undefined) data.leadId = body.leadId;
      if (body.contractId !== undefined) data.contractId = body.contractId;
      if (body.siteId !== undefined) data.siteId = body.siteId;

      const activity = await prisma.activity.update({ where: { id }, data });
      return json(res, 200, { activity: toClient(activity) });
    }

    if (req.method === 'DELETE') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Atividade não encontrada' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      await prisma.activity.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};
