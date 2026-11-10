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

const patchSchema = createSchema.partial();

function one(v) { return Array.isArray(v) ? v[0] : v; }

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

function paymentToClient(p) {
  return {
    id: p.id,
    contractId: p.contractId,
    value: money(p.value),
    status: p.status,
    dueDate: p.dueDate || null,
    paidAt: p.paidAt || null,
    method: p.method || '',
    note: p.note || '',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
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
    const id = one(req.query.id);

    if (req.method === 'GET' && !id) {
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
        await prisma.lead.update({ where: { id: leadId }, data: { status: 'fechado', value: body.value } }).catch(() => { });
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

    if (!id) return json(res, 400, { error: 'ID inválido' });

    const found = await loadScoped(user, id);
    if (found.error === 404) return json(res, 404, { error: 'Contrato não encontrado' });
    if (found.error === 403) return json(res, 403, { error: 'Sem permissão para este contrato' });

    if (req.method === 'GET') {
      const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
          lead: { select: { id: true, name: true, company: true } },
          payments: { orderBy: { createdAt: 'desc' } },
          activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      });
      return json(res, 200, {
        contract: Object.assign(toClient(contract), {
          payments: (contract.payments || []).map(paymentToClient),
          activities: (contract.activities || []).map(a => ({ id: a.id, type: a.type, title: a.title, description: a.description, createdAt: a.createdAt })),
        }),
      });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = patchSchema.parse(await readJson(req));
      const data = {};
      if (body.clientName !== undefined) data.clientName = body.clientName;
      if (body.clientEmail !== undefined) data.clientEmail = body.clientEmail.toLowerCase();
      if (body.service !== undefined) data.service = body.service;
      if (body.value !== undefined) data.value = body.value;
      if (body.status !== undefined) data.status = body.status;
      if (body.signedAt !== undefined) data.signedAt = dateOrNull(body.signedAt);
      if (body.expiresAt !== undefined) data.expiresAt = dateOrNull(body.expiresAt);
      if (body.leadId !== undefined) data.leadId = body.leadId || null;

      if (body.status === 'ativo' && !found.contract.signedAt && body.signedAt === undefined) {
        data.signedAt = new Date();
      }

      const contract = await prisma.contract.update({
        where: { id },
        data,
        include: { lead: { select: { id: true, name: true, company: true } } },
      });

      if (body.status === 'ativo' && found.contract.status !== 'ativo') {
        await logActivity({
          type: 'contract_signed',
          title: 'Contrato assinado',
          description: `${contract.clientName} · ${contract.service}`,
          userId: user.id,
          contractId: contract.id,
        });
      }

      return json(res, 200, { contract: toClient(contract) });
    }

    if (req.method === 'DELETE') {
      await prisma.contract.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};

module.exports.toClient = toClient;
module.exports.paymentToClient = paymentToClient;
module.exports.CONTRACT_STATUS = CONTRACT_STATUS;
