const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const { prisma, dateOrNull, getParamId, logActivity } = require('../../lib/business');
const { paymentToClient } = require('../contracts/[id]');
const { PAYMENT_STATUS } = require('./index');

const patchSchema = z.object({
  value: z.coerce.number().min(0).max(99999999).optional(),
  status: z.enum(PAYMENT_STATUS).optional(),
  dueDate: z.string().nullish(),
  paidAt: z.string().nullish(),
  method: z.string().trim().max(60).nullish(),
  note: z.string().max(2000).nullish(),
});

async function loadScoped(user, id) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { contract: { select: { id: true, clientName: true, service: true, createdById: true } } },
  });
  if (!payment) return { error: 404 };
  if (user.role !== 'admin' && (!payment.contract || payment.contract.createdById !== user.id)) return { error: 403 };
  return { payment };
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = getParamId(req);
    if (!id) return json(res, 400, { error: 'ID inválido' });

    const found = await loadScoped(user, id);
    if (found.error === 404) return json(res, 404, { error: 'Pagamento não encontrado' });
    if (found.error === 403) return json(res, 403, { error: 'Sem permissão para este pagamento' });

    if (req.method === 'GET') {
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { contract: { select: { id: true, clientName: true, service: true } } },
      });
      return json(res, 200, {
        payment: Object.assign(paymentToClient(payment), {
          clientName: payment.contract ? payment.contract.clientName : '',
          service: payment.contract ? payment.contract.service : '',
        }),
      });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = patchSchema.parse(await readJson(req));
      const data = {};
      if (body.value !== undefined) data.value = body.value;
      if (body.status !== undefined) data.status = body.status;
      if (body.dueDate !== undefined) data.dueDate = dateOrNull(body.dueDate);
      if (body.paidAt !== undefined) data.paidAt = dateOrNull(body.paidAt);
      if (body.method !== undefined) data.method = body.method || null;
      if (body.note !== undefined) data.note = body.note || null;
      if (body.status === 'pago' && body.paidAt === undefined && !found.payment.paidAt) data.paidAt = new Date();

      const payment = await prisma.payment.update({
        where: { id },
        data,
        include: { contract: { select: { id: true, clientName: true, service: true } } },
      });

      if (body.status === 'pago' && found.payment.status !== 'pago') {
        await logActivity({
          type: 'payment_received',
          title: 'Pagamento recebido',
          description: `${payment.contract ? payment.contract.clientName : ''} · R$ ${Number(payment.value).toFixed(2)}`,
          userId: user.id,
          contractId: payment.contractId,
        });
      }

      return json(res, 200, {
        payment: Object.assign(paymentToClient(payment), {
          clientName: payment.contract ? payment.contract.clientName : '',
          service: payment.contract ? payment.contract.service : '',
        }),
      });
    }

    if (req.method === 'DELETE') {
      await prisma.payment.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};
