const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const { prisma, money, dateOrNull, logActivity } = require('../../lib/business');

//   GET    /api/payments          -> lista
//   GET    /api/payments?id=...   -> detalhe
//   POST   /api/payments          -> cria
//   PATCH  /api/payments?id=...   -> atualiza
//   DELETE /api/payments?id=...   -> remove

const PAYMENT_STATUS = ['pendente', 'pago', 'atrasado', 'estornado'];

const createSchema = z.object({
  contractId: z.string().trim().min(1).max(40),
  value: z.coerce.number().min(0).max(99999999).optional().default(0),
  status: z.enum(PAYMENT_STATUS).optional().default('pendente'),
  dueDate: z.string().nullish(),
  paidAt: z.string().nullish(),
  method: z.string().trim().max(60).nullish(),
  note: z.string().max(2000).nullish(),
});

const patchSchema = z.object({
  value: z.coerce.number().min(0).max(99999999).optional(),
  status: z.enum(PAYMENT_STATUS).optional(),
  dueDate: z.string().nullish(),
  paidAt: z.string().nullish(),
  method: z.string().trim().max(60).nullish(),
  note: z.string().max(2000).nullish(),
});

function one(v) { return Array.isArray(v) ? v[0] : v; }

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
    clientName: p.contract ? p.contract.clientName : '',
    service: p.contract ? p.contract.service : '',
  };
}

// Pagamentos herdam o escopo do contrato (admin: tudo; demais: contratos próprios)
function contractScope(user) {
  return user.role === 'admin' ? {} : { contract: { createdById: user.id } };
}

const contractSelect = { select: { id: true, clientName: true, service: true, createdById: true } };

async function loadScoped(user, id) {
  const payment = await prisma.payment.findUnique({ where: { id }, include: { contract: contractSelect } });
  if (!payment) return { error: 404 };
  if (user.role !== 'admin' && (!payment.contract || payment.contract.createdById !== user.id)) return { error: 403 };
  return { payment };
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = one(req.query.id);

    if (req.method === 'GET' && !id) {
      const payments = await prisma.payment.findMany({
        where: contractScope(user),
        orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        include: { contract: contractSelect },
      });
      return json(res, 200, { payments: payments.map(paymentToClient) });
    }

    if (req.method === 'POST') {
      const body = createSchema.parse(await readJson(req));
      const contract = await prisma.contract.findUnique({ where: { id: body.contractId } });
      if (!contract) return json(res, 400, { error: 'Contrato informado não existe' });
      if (user.role !== 'admin' && contract.createdById !== user.id) return json(res, 403, { error: 'Sem permissão para este contrato' });

      const payment = await prisma.payment.create({
        data: {
          contractId: contract.id,
          value: body.value,
          status: body.status,
          dueDate: dateOrNull(body.dueDate) || null,
          paidAt: dateOrNull(body.paidAt) || (body.status === 'pago' ? new Date() : null),
          method: body.method || null,
          note: body.note || null,
        },
        include: { contract: contractSelect },
      });

      if (payment.status === 'pago') {
        await logActivity({
          type: 'payment_received',
          title: 'Pagamento recebido',
          description: `${contract.clientName} · R$ ${money(payment.value).toFixed(2)}`,
          userId: user.id,
          contractId: contract.id,
        });
      }

      return json(res, 201, { payment: paymentToClient(payment) });
    }

    if (!id) return json(res, 400, { error: 'ID inválido' });

    const found = await loadScoped(user, id);
    if (found.error === 404) return json(res, 404, { error: 'Pagamento não encontrado' });
    if (found.error === 403) return json(res, 403, { error: 'Sem permissão para este pagamento' });

    if (req.method === 'GET') {
      const payment = await prisma.payment.findUnique({ where: { id }, include: { contract: contractSelect } });
      return json(res, 200, { payment: paymentToClient(payment) });
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

      const payment = await prisma.payment.update({ where: { id }, data, include: { contract: contractSelect } });

      if (body.status === 'pago' && found.payment.status !== 'pago') {
        await logActivity({
          type: 'payment_received',
          title: 'Pagamento recebido',
          description: `${payment.contract ? payment.contract.clientName : ''} · R$ ${Number(payment.value).toFixed(2)}`,
          userId: user.id,
          contractId: payment.contractId,
        });
      }

      return json(res, 200, { payment: paymentToClient(payment) });
    }

    if (req.method === 'DELETE') {
      await prisma.payment.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};

module.exports.paymentToClient = paymentToClient;
module.exports.PAYMENT_STATUS = PAYMENT_STATUS;
