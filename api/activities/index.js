const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const { prisma, scopeWhere, logActivity } = require('../../lib/business');

const ACTIVITY_TYPE = [
  'lead_created', 'lead_contacted', 'lead_qualified',
  'contract_created', 'contract_signed',
  'payment_received', 'payment_overdue',
  'site_published', 'user_created', 'user_blocked',
  'ticket_created', 'ticket_resolved',
];

const createSchema = z.object({
  type: z.enum(ACTIVITY_TYPE),
  title: z.string().trim().min(2).max(180),
  description: z.string().max(2000).nullish(),
  leadId: z.string().trim().max(40).nullish(),
  contractId: z.string().trim().max(40).nullish(),
  siteId: z.string().trim().max(40).nullish(),
});

// Só o próprio autor, ou entidades relacionadas ao usuário, aparecem no feed
function toClient(activity) {
  return {
    id: activity.id,
    type: activity.type,
    title: activity.title,
    description: activity.description || '',
    userId: activity.userId,
    leadId: activity.leadId || null,
    contractId: activity.contractId || null,
    siteId: activity.siteId || null,
    createdAt: activity.createdAt,
    author: activity.user ? { id: activity.user.id, name: activity.user.name, initials: activity.user.initials } : null,
    lead: activity.lead ? { id: activity.lead.id, name: activity.lead.name } : null,
    contract: activity.contract ? { id: activity.contract.id, clientName: activity.contract.clientName } : null,
    site: activity.site ? { id: activity.site.id, name: activity.site.name, domain: activity.site.domain } : null,
  };
}

async function canReference(user, body) {
  if (body.leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: body.leadId } });
    if (!lead || (user.role !== 'admin' && lead.createdById !== user.id)) return false;
  }
  if (body.contractId) {
    const contract = await prisma.contract.findUnique({ where: { id: body.contractId } });
    if (!contract || (user.role !== 'admin' && contract.createdById !== user.id)) return false;
  }
  if (body.siteId) {
    const site = await prisma.site.findUnique({ where: { id: body.siteId } });
    const mine = site && (site.createdById === user.id || site.clientId === user.id);
    if (!site || (user.role !== 'admin' && !mine)) return false;
  }
  return true;
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      const limitRaw = parseInt(url.searchParams.get('limit') || '20', 10);
      const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 20, 1), 100);

      const activities = await prisma.activity.findMany({
        where: scopeWhere(user, ['userId']),
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { id: true, name: true, initials: true } },
          lead: { select: { id: true, name: true } },
          contract: { select: { id: true, clientName: true } },
          site: { select: { id: true, name: true, domain: true } },
        },
      });
      return json(res, 200, { activities: activities.map(toClient) });
    }

    if (req.method === 'POST') {
      // registros automáticos são gerados pelas APIs; criação manual é restrita a administradores
      if (user.role !== 'admin') return json(res, 403, { error: 'Acesso restrito a administradores' });
      const body = createSchema.parse(await readJson(req));
      if (!(await canReference(user, body))) return json(res, 403, { error: 'Sem permissão para as referências informadas' });

      const created = await prisma.activity.create({
        data: {
          type: body.type,
          title: body.title,
          description: body.description || null,
          userId: user.id,
          leadId: body.leadId || null,
          contractId: body.contractId || null,
          siteId: body.siteId || null,
        },
      });
      return json(res, 201, { activity: toClient(created) });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (err) { return handleError(res, err); }
};

module.exports.toClient = toClient;
