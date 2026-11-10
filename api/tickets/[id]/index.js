const prisma = require('../../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, z } = require('../../../lib/http');
const { requireAuth } = require('../../../lib/auth');

const schema = z.object({
  text: z.string().min(1).max(4000),
  status: z.enum(['aberto', 'respondido', 'resolvido']).optional(),
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
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const isAdmin = user.role === 'admin';
    const id = parseInt(req.query.id, 10);
    if (!id || Number.isNaN(id)) return json(res, 400, { error: 'ID inválido' });

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return json(res, 404, { error: 'Ticket não encontrado' });
    if (!isAdmin && ticket.createdById !== user.id) return json(res, 403, { error: 'Acesso negado' });

    const body = schema.parse(await readJson(req));
    const authorType = isAdmin ? 'admin' : 'cliente';
    // default status transitions: admin reply -> respondido; client reply reopens
    let nextStatus = ticket.status;
    if (isAdmin) nextStatus = body.status && body.status === 'resolvido' ? 'resolvido' : 'respondido';
    else if (ticket.status !== 'aberto') nextStatus = 'aberto';

    await prisma.ticketMessage.create({
      data: { ticketId: id, authorId: user.id, authorType, text: body.text, read: true }
    });
    const updated = await prisma.ticket.update({
      where: { id },
      data: { status: nextStatus, updatedAt: new Date() },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
    return json(res, 201, { ticket: toClient(updated) });
  } catch (err) { return handleError(res, err); }
};
