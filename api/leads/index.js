const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const { prisma, money, dateOrNull, scopeWhere, logActivity } = require('../../lib/business');

//   GET    /api/leads          -> lista (escopo do usuário)
//   GET    /api/leads?id=...   -> detalhe
//   POST   /api/leads          -> cria
//   PATCH  /api/leads?id=...   -> atualiza
//   DELETE /api/leads?id=...   -> remove

const LEAD_STATUS = ['novo', 'contato', 'qualificado', 'proposta', 'fechado', 'perdido'];

const createSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).nullish(),
  company: z.string().trim().max(160).nullish(),
  status: z.enum(LEAD_STATUS).optional().default('novo'),
  source: z.string().trim().max(80).nullish(),
  value: z.coerce.number().min(0).max(99999999).optional().default(0),
  note: z.string().max(4000).nullish(),
  lastContact: z.string().nullish(),
});

const patchSchema = createSchema.partial();

const ACTIVITY_BY_STATUS = {
  contato: { type: 'lead_contacted', title: 'Lead contatado' },
  qualificado: { type: 'lead_qualified', title: 'Lead qualificado' },
};

function one(v) { return Array.isArray(v) ? v[0] : v; }

function toClient(lead) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone || '',
    company: lead.company || '',
    status: lead.status,
    source: lead.source || '',
    value: money(lead.value),
    note: lead.note || '',
    lastContact: lead.lastContact || null,
    createdById: lead.createdById,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

async function findScoped(user, id) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return { error: 404 };
  if (user.role !== 'admin' && lead.createdById !== user.id) return { error: 403 };
  return { lead };
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = one(req.query.id);

    if (req.method === 'GET' && !id) {
      const leads = await prisma.lead.findMany({
        where: scopeWhere(user, ['createdById']),
        orderBy: { createdAt: 'desc' },
      });
      return json(res, 200, { leads: leads.map(toClient) });
    }

    if (req.method === 'POST') {
      const body = createSchema.parse(await readJson(req));
      const lead = await prisma.lead.create({
        data: {
          name: body.name,
          email: body.email.toLowerCase(),
          phone: body.phone || null,
          company: body.company || null,
          status: body.status,
          source: body.source || null,
          value: body.value,
          note: body.note || null,
          lastContact: dateOrNull(body.lastContact) || null,
          createdById: user.id,
        },
      });
      await logActivity({
        type: 'lead_created',
        title: 'Novo lead prospectado',
        description: `${lead.company || lead.name} entrou no funil`,
        userId: user.id,
        leadId: lead.id,
      });
      return json(res, 201, { lead: toClient(lead) });
    }

    if (!id) return json(res, 400, { error: 'ID inválido' });

    const found = await findScoped(user, id);
    if (found.error === 404) return json(res, 404, { error: 'Lead não encontrado' });
    if (found.error === 403) return json(res, 403, { error: 'Sem permissão para este lead' });

    if (req.method === 'GET') {
      const lead = await prisma.lead.findUnique({
        where: { id },
        include: {
          contracts: { orderBy: { createdAt: 'desc' } },
          activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      });
      return json(res, 200, {
        lead: Object.assign(toClient(lead), {
          contracts: (lead.contracts || []).map(c => ({ id: c.id, service: c.service, status: c.status, value: Number(c.value), createdAt: c.createdAt })),
          activities: (lead.activities || []).map(a => ({ id: a.id, type: a.type, title: a.title, description: a.description, createdAt: a.createdAt })),
        }),
      });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = patchSchema.parse(await readJson(req));
      const data = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.email !== undefined) data.email = body.email.toLowerCase();
      if (body.phone !== undefined) data.phone = body.phone || null;
      if (body.company !== undefined) data.company = body.company || null;
      if (body.status !== undefined) data.status = body.status;
      if (body.source !== undefined) data.source = body.source || null;
      if (body.value !== undefined) data.value = body.value;
      if (body.note !== undefined) data.note = body.note || null;
      if (body.lastContact !== undefined) data.lastContact = dateOrNull(body.lastContact);

      const previous = found.lead;
      await prisma.lead.update({ where: { id }, data });

      if (body.status && body.status !== previous.status) {
        const activity = ACTIVITY_BY_STATUS[body.status];
        if (activity) {
          await logActivity({
            type: activity.type,
            title: activity.title,
            description: previous.company || previous.name,
            userId: user.id,
            leadId: id,
          });
        }
        if (body.status === 'contato' && !previous.lastContact) {
          await prisma.lead.update({ where: { id }, data: { lastContact: new Date() } });
        }
      }
      const fresh = await prisma.lead.findUnique({ where: { id } });
      return json(res, 200, { lead: toClient(fresh) });
    }

    if (req.method === 'DELETE') {
      await prisma.lead.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};

module.exports.toClient = toClient;
module.exports.LEAD_STATUS = LEAD_STATUS;
