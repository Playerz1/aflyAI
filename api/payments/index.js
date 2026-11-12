const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');

function one(v) { return Array.isArray(v) ? v[0] : v; }

const createSchema = z.object({
  contractId: z.string(),
  value: z.number().optional().default(0),
  status: z.enum(['pendente', 'pago', 'atrasado', 'estornado']).optional().default('pendente'),
  dueDate: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
  method: z.string().max(40).optional(),
  note: z.string().max(4000).optional().default(''),
});

const patchSchema = z.object({
  contractId: z.string().optional(),
  value: z.number().optional(),
  status: z.enum(['pendente', 'pago', 'atrasado', 'estornado']).optional(),
  dueDate: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
  method: z.string().max(40).optional(),
  note: z.string().max(4000).optional(),
});

function toClient(p) {
  return {
    id: p.id,
    contractId: p.contractId,
    value: Number(p.value || 0),
    status: p.status,
    dueDate: p.dueDate,
    paidAt: p.paidAt,
    method: p.method,
    note: p.note,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

async function loadScoped(user, id) {
  const payment = await prisma.payment.findUnique({ where: { id }, include: { contract: true } });
  if (!payment) return { error: 404 };
  if (user.role !== 'admin' && payment.contract.createdById !== user.id) return { error: 403 };
  return { payment };
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
        if (found.error === 404) return json(res, 404, { error: 'Pagamento não encontrado' });
        if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
        return json(res, 200, { payment: toClient(found.payment) });
      }
      const where = isAdmin ? {} : { contract: { createdById: user.id } };
      const payments = await prisma.payment.findMany({
        where,
        include: { contract: { select: { id: true, clientName: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return json(res, 200, { payments: payments.map(toClient) });
    }

    if (req.method === 'POST') {
      const body = createSchema.parse(await readJson(req));
      // Verify contract access
      const contract = await prisma.contract.findUnique({ where: { id: body.contractId } });
      if (!contract) return json(res, 404, { error: 'Contrato não encontrado' });
      if (user.role !== 'admin' && contract.createdById !== user.id) return json(res, 403, { error: 'Acesso negado' });

      const payment = await prisma.payment.create({
        data: {
          contractId: body.contractId,
          value: body.value,
          status: body.status,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          paidAt: body.paidAt ? new Date(body.paidAt) : null,
          method: body.method || null,
          note: body.note || null,
        },
      });
      return json(res, 201, { payment: toClient(payment) });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Pagamento não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      const body = patchSchema.parse(await readJson(req));
      const data = {};
      if (body.value !== undefined) data.value = body.value;
      if (body.status !== undefined) data.status = body.status;
      if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      if (body.paidAt !== undefined) data.paidAt = body.paidAt ? new Date(body.paidAt) : null;
      if (body.method !== undefined) data.method = body.method;
      if (body.note !== undefined) data.note = body.note;
      data.updatedAt = new Date();

      const payment = await prisma.payment.update({ where: { id }, data });
      return json(res, 200, { payment: toClient(payment) });
    }

    if (req.method === 'DELETE') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Pagamento não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      await prisma.payment.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};
