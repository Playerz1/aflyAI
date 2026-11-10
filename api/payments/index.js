const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const { prisma, money, dateOrNull, logActivity } = require('../../lib/business');
const { paymentToClient } = require('../contracts/[id]');

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

// Pagamentos herdam o escopo do contrato (admin: tudo; demais: contratos próprios)
function contractScope(user) {
  return user.role === 'admin' ? {} : { contract: { createdById: user.id } };
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const payments = await prisma.payment.findMany({
        where: contractScope(user),
        orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        include: { contract: { select: { id: true, clientName: true, service: true } } },
      });
      return json(res, 200, {
        payments: payments.map(p => Object.assign(paymentToClient(p), {
          clientName: p.contract ? p.contract.clientName : '',
          service: p.contract ? p.contract.service : '',
        })),
      });
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
        include: { contract: { select: { id: true, clientName: true, service: true } } },
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

      return json(res, 201, {
        payment: Object.assign(paymentToClient(payment), {
          clientName: payment.contract ? payment.contract.clientName : '',
          service: payment.contract ? payment.contract.service : '',
        }),
      });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (err) { return handleError(res, err); }
};

module.exports.PAYMENT_STATUS = PAYMENT_STATUS;
