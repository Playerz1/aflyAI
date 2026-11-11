const { json, readJson, handleError, methodNotAllowed } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const prisma = require('../../lib/prisma');
const { z } = require('zod');

const createSchema = z.object({
  negotiationId: z.string().min(1),
  value: z.number().positive(),
  type: z.enum(['unica', 'recorrente']),
  monthlyValue: z.number().min(0).optional().nullable(),
  date: z.string().datetime().optional(),
  description: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// POST /api/sales — registra uma venda vinculada a uma negociação
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const body = createSchema.parse(await readJson(req));

    // Verifica se a negociação existe e pertence ao usuário
    const negotiation = await prisma.negotiation.findUnique({
      where: { id: body.negotiationId },
      include: { sale: true },
    });
    if (!negotiation) return json(res, 404, { error: 'Negociação não encontrada' });
    if (negotiation.createdById !== user.id) return json(res, 403, { error: 'Acesso negado' });
    if (negotiation.sale) return json(res, 409, { error: 'Esta negociação já possui uma venda registrada' });

    const saleDate = body.date ? new Date(body.date) : new Date();

    const sale = await prisma.sale.create({
      data: {
        negotiationId: body.negotiationId,
        value: body.value,
        type: body.type,
        monthlyValue: body.type === 'recorrente' ? (body.monthlyValue || 0) : null,
        saleDate: saleDate,
        description: body.description,
        notes: body.notes,
        createdById: user.id,
      },
    };

    // Atualiza status da negociação para vendido
    await prisma.negotiation.update({
      where: { id: body.negotiationId },
      data: { status: 'vendido', updatedAt: new Date() },
    });

    return json(res, 201, { ok: true, sale });
  } catch (err) { return handleError(res, err); }
};
