const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const { prisma, money, dateOrNull, scopeWhere, logActivity } = require('../../lib/business');

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

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
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

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (err) { return handleError(res, err); }
};

module.exports.toClient = toClient;
module.exports.LEAD_STATUS = LEAD_STATUS;
