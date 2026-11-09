const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');

const patchSchema = z.object({
  status: z.enum(['aberto', 'respondido', 'resolvido']).optional(),
  priority: z.enum(['baixa', 'media', 'alta']).optional(),
  subject: z.string().min(2).max(180).optional(),
});

function toClient(t) {
  return {
    id: t.id,
    assunto: t.subject,
    motivo: t.reason,
    motivoRotulo: t.reasonLabel,
    prioridade: t.priority,
    status: t.status,
    cliente: { nome: t.creatorName, iniciais: t.creatorInitials, email: t.creatorEmail, plano: t.creatorPlan },
    origem: t.origin,
    criado: t.createdAt,
    atualizado: t.updatedAt,
    createdById: t.createdById,
    mensagens: (t.messages || []).map(m => ({ id: m.id, autor: m.authorType, texto: m.text, em: m.createdAt, lida: m.read })),
  };
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const isAdmin = user.role === 'admin';
    const id = parseInt(req.query.id, 10);
    if (!id || Number.isNaN(id)) return json(res, 400, { error: 'ID inválido' });

    const existing = await prisma.ticket.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    if (!existing) return json(res, 404, { error: 'Ticket não encontrado' });
    if (!isAdmin && existing.createdById !== user.id) return json(res, 403, { error: 'Acesso negado' });

    if (req.method === 'GET') {
      // mark messages as read appropriately
      if (isAdmin) {
        await prisma.ticketMessage.updateMany({ where: { ticketId: id, authorType: 'cliente', read: false }, data: { read: true } });
      } else {
        await prisma.ticketMessage.updateMany({ where: { ticketId: id, authorType: { in: ['suporte', 'admin'] }, read: false }, data: { read: true } });
      }
      const fresh = await prisma.ticket.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
      return json(res, 200, { ticket: toClient(fresh) });
    }

    if (req.method === 'PATCH') {
      const body = patchSchema.parse(await readJson(req));
      const data = {};
      if (body.status !== undefined) {
        // clients can only reopen in limited cases? allow admin full control; client can set aberto when replying handled elsewhere
        if (!isAdmin && !(body.status === 'aberto')) return json(res, 403, { error: 'Acesso negado' });
        data.status = body.status;
      }
      if (body.priority !== undefined) { if (!isAdmin) return json(res, 403, { error: 'Acesso negado' }); data.priority = body.priority; }
      if (body.subject !== undefined) { if (!isAdmin) return json(res, 403, { error: 'Acesso negado' }); data.subject = body.subject; }
      data.updatedAt = new Date();
      const ticket = await prisma.ticket.update({ where: { id }, data, include: { messages: { orderBy: { createdAt: 'asc' } } } });
      return json(res, 200, { ticket: toClient(ticket) });
    }

    return methodNotAllowed(res, ['GET', 'PATCH']);
  } catch (err) { return handleError(res, err); }
};
