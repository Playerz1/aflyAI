const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const { prisma, money, dateOrNull, getParamId, logActivity } = require('../../lib/business');
const { toClient, CONTRACT_STATUS } = require('./index');

const patchSchema = z.object({
  clientName: z.string().trim().min(2).max(160).optional(),
  clientEmail: z.string().trim().email().max(255).optional(),
  service: z.string().trim().min(2).max(160).optional(),
  value: z.coerce.number().min(0).max(99999999).optional(),
  status: z.enum(CONTRACT_STATUS).optional(),
  signedAt: z.string().nullish(),
  expiresAt: z.string().nullish(),
  leadId: z.string().trim().max(40).nullish(),
});

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
    const id = getParamId(req);
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

    return methodNotAllowed(res, ['GET', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};

module.exports.paymentToClient = paymentToClient;
