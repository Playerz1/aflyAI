const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');

function initials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

const MOTIVOS = {
  duvida: 'Dúvida de uso', site: 'Problema em um site', contrato: 'Contrato e cobrança',
  lead: 'Leads ou extensão', acesso: 'Acesso e login', outro: 'Outro assunto',
};

const createSchema = z.object({
  subject: z.string().min(2).max(180),
  description: z.string().max(4000).optional().default(''),
  reason: z.string().max(40).optional().default('outro'),
  reasonLabel: z.string().max(120).optional(),
  priority: z.enum(['baixa', 'media', 'alta']).optional().default('media'),
  status: z.enum(['aberto', 'respondido', 'resolvido']).optional().default('aberto'),
  origin: z.string().max(120).optional().default('Dashboard'),
});

function toClient(t) {
  const last = t.messages && t.messages.length ? t.messages[t.messages.length - 1] : null;
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
    _last: last ? last.createdAt : t.updatedAt,
  };
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const isAdmin = user.role === 'admin';

    if (req.method === 'GET') {
      const where = isAdmin ? {} : { createdById: user.id };
      const tickets = await prisma.ticket.findMany({ where, include: { messages: { orderBy: { createdAt: 'asc' } } }, orderBy: { updatedAt: 'desc' } });
      return json(res, 200, { tickets: tickets.map(toClient) });
    }

    if (req.method === 'POST') {
      const body = createSchema.parse(await readJson(req));
      const reasonLabel = body.reasonLabel || MOTIVOS[body.reason] || 'Outro assunto';
      const text = body.description ? `${body.subject}\n\n${body.description}` : body.subject;
      const ticket = await prisma.ticket.create({
        data: {
          subject: body.subject,
          reason: body.reason,
          reasonLabel,
          priority: body.priority,
          status: body.status,
          origin: body.origin,
          createdById: user.id,
          creatorName: user.name,
          creatorInitials: user.initials || initials(user.name),
          creatorEmail: user.email,
          creatorPlan: user.plan || '',
          messages: { create: [{ authorId: user.id, authorType: 'cliente', text, read: true }] }
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
      return json(res, 201, { ticket: toClient(ticket) });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (err) { return handleError(res, err); }
};

module.exports.toClient = toClient;
