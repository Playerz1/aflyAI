const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const { prisma, money, dateOrNull, scopeWhere, logActivity } = require('../../lib/business');

const CONTRACT_STATUS = ['rascunho', 'ativo', 'vencido', 'cancelado'];

const createSchema = z.object({
  clientName: z.string().trim().min(2).max(160),
  clientEmail: z.string().trim().email().max(255),
  service: z.string().trim().min(2).max(160),
  value: z.coerce.number().min(0).max(99999999).optional().default(0),
  status: z.enum(CONTRACT_STATUS).optional().default('rascunho'),
  signedAt: z.string().nullish(),
  expiresAt: z.string().nullish(),
  leadId: z.string().trim().max(40).nullish(),
  note: z.string().max(4000).nullish(),
});

function toClient(contract) {
  return {
    id: contract.id,
    clientName: contract.clientName,
    clientEmail: contract.clientEmail,
    service: contract.service,
    value: money(contract.value),
    status: contract.status,
    signedAt: contract.signedAt || null,
    expiresAt: contract.expiresAt || null,
    leadId: contract.leadId || null,
    lead: contract.lead ? { id: contract.lead.id, name: contract.lead.name, company: contract.lead.company } : null,
    createdById: contract.createdById,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    paymentsCount: contract._count ? contract._count.payments : undefined,
  };
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const contracts = await prisma.contract.findMany({
        where: scopeWhere(user, ['createdById']),
        orderBy: { createdAt: 'desc' },
        include: { lead: { select: { id: true, name: true, company: true } }, _count: { select: { payments: true } } },
      });
      return json(res, 200, { contracts: contracts.map(toClient) });
    }

    if (req.method === 'POST') {
      const body = createSchema.parse(await readJson(req));

      let leadId = null;
      if (body.leadId) {
        const lead = await prisma.lead.findUnique({ where: { id: body.leadId } });
        if (!lead) return json(res, 400, { error: 'Lead informado não existe' });
        if (user.role !== 'admin' && lead.createdById !== user.id) return json(res, 403, { error: 'Sem permissão para este lead' });
        leadId = lead.id;
      }

      const contract = await prisma.contract.create({
        data: {
          clientName: body.clientName,
          clientEmail: body.clientEmail.toLowerCase(),
          service: body.service,
          value: body.value,
          status: body.status,
          signedAt: dateOrNull(body.signedAt) || null,
          expiresAt: dateOrNull(body.expiresAt) || null,
          leadId,
          createdById: user.id,
        },
        include: { lead: { select: { id: true, name: true, company: true } } },
      });

      if (leadId && body.status !== 'rascunho') {
        await prisma.lead.update({ where: { id: leadId }, data: { status: 'fechado', value: body.value } }).catch(() => {});
      }

      await logActivity({
        type: body.status === 'ativo' || body.signedAt ? 'contract_signed' : 'contract_created',
        title: body.status === 'ativo' || body.signedAt ? 'Contrato assinado' : 'Contrato criado',
        description: `${contract.clientName} · ${contract.service}`,
        userId: user.id,
        contractId: contract.id,
        leadId,
      });

      return json(res, 201, { contract: toClient(contract) });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (err) { return handleError(res, err); }
};

module.exports.toClient = toClient;
module.exports.CONTRACT_STATUS = CONTRACT_STATUS;
