const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');

//   GET    /api/tickets                    -> lista
//   GET    /api/tickets?id=N               -> detalhe (marca como lido)
//   POST   /api/tickets                    -> abre ticket
//   POST   /api/tickets?id=N&action=message -> envia mensagem no ticket
//   PATCH  /api/tickets?id=N               -> muda status/prioridade/assunto

function initials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

function one(v) { return Array.isArray(v) ? v[0] : v; }

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

// Aceita também o formato pt-BR vindo da UI (assunto/descricao/motivo/motivoRotulo/prioridade/origem).
// Serve de garantia enquanto navegadores ainda tiverem o store antigo em cache.
function normalizeTicketBody(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  if (raw.subject === undefined && raw.assunto !== undefined) {
    const out = {
      subject: String(raw.assunto || '').trim(),
      description: raw.descricao !== undefined ? String(raw.descricao || '') : '',
      reason: raw.motivo || 'outro',
      priority: raw.prioridade || 'media',
      origin: raw.origem || 'Dashboard',
    };
    if (raw.motivoRotulo) out.reasonLabel = String(raw.motivoRotulo).slice(0, 120);
    if (raw.status) out.status = raw.status;
    return out;
  }
  return raw;
}

const patchSchema = z.object({
  status: z.enum(['aberto', 'respondido', 'resolvido']).optional(),
  priority: z.enum(['baixa', 'media', 'alta']).optional(),
  subject: z.string().min(2).max(180).optional(),
});

const messageSchema = z.object({
  text: z.string().min(1).max(4000),
  status: z.enum(['aberto', 'respondido', 'resolvido']).optional(),
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

async function loadScoped(user, id) {
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
  if (!ticket) return { error: 404 };
  if (user.role !== 'admin' && ticket.createdById !== user.id) return { error: 403 };
  return { ticket };
}

async function enviarMensagem(req, res, user, id) {
  const found = await loadScoped(user, id);
  if (found.error === 404) return json(res, 404, { error: 'Ticket não encontrado' });
  if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

  const body = messageSchema.parse(await readJson(req));
  const isAdmin = user.role === 'admin';
  const authorType = isAdmin ? 'admin' : 'cliente';

  let nextStatus = found.ticket.status;
  if (isAdmin) nextStatus = body.status === 'resolvido' ? 'resolvido' : 'respondido';
  else if (found.ticket.status !== 'aberto') nextStatus = 'aberto';

  await prisma.ticketMessage.create({
    data: { ticketId: id, authorId: user.id, authorType, text: body.text, read: true },
  });
  const updated = await prisma.ticket.update({
    where: { id },
    data: { status: nextStatus, updatedAt: new Date() },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  return json(res, 201, { ticket: toClient(updated) });
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const isAdmin = user.role === 'admin';
    const action = one(req.query.action);
    const rawId = one(req.query.id);
    const id = rawId ? parseInt(rawId, 10) : null;

    if (req.method === 'GET') {
      if (id) {
        const found = await loadScoped(user, id);
        if (found.error === 404) return json(res, 404, { error: 'Ticket não encontrado' });
        if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
        await prisma.ticketMessage.updateMany({
          where: { ticketId: id, ...(isAdmin ? { authorType: 'cliente' } : { authorType: { in: ['suporte', 'admin'] } }), read: false },
          data: { read: true },
        });
        const fresh = await prisma.ticket.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
        return json(res, 200, { ticket: toClient(fresh) });
      }
      const where = isAdmin ? {} : { createdById: user.id };
      const tickets = await prisma.ticket.findMany({ where, include: { messages: { orderBy: { createdAt: 'asc' } } }, orderBy: { updatedAt: 'desc' } });
      return json(res, 200, { tickets: tickets.map(toClient) });
    }

    if (req.method === 'POST') {
      if (id && action === 'message') return enviarMensagem(req, res, user, id);
      const body = createSchema.parse(normalizeTicketBody(await readJson(req)));
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
          messages: { create: [{ authorId: user.id, authorType: 'cliente', text, read: true }] },
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      return json(res, 201, { ticket: toClient(ticket) });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Ticket não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      const patchRaw = await readJson(req);
      const body = patchSchema.parse({
        status: patchRaw.status,
        priority: patchRaw.priority !== undefined ? patchRaw.priority : patchRaw.prioridade,
        subject: patchRaw.subject !== undefined ? patchRaw.subject : patchRaw.assunto,
      });
      const data = {};
      if (body.status !== undefined) {
        if (!isAdmin && body.status !== 'aberto') return json(res, 403, { error: 'Acesso negado' });
        data.status = body.status;
      }
      if (body.priority !== undefined) { if (!isAdmin) return json(res, 403, { error: 'Acesso negado' }); data.priority = body.priority; }
      if (body.subject !== undefined) { if (!isAdmin) return json(res, 403, { error: 'Acesso negado' }); data.subject = body.subject; }
      data.updatedAt = new Date();
      const ticket = await prisma.ticket.update({ where: { id }, data, include: { messages: { orderBy: { createdAt: 'asc' } } } });
      return json(res, 200, { ticket: toClient(ticket) });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT']);
  } catch (err) { return handleError(res, err); }
};

/* ---------- SSE stream (incorporado de stream.js) ---------- */
async function handleStream(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const user = await requireAuth(req, res);
  if (!user) return;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write('data: {"type":"hello"}\n\n');

  let interval;
  try {
    interval = setInterval(async () => {
      try {
        const agora = new Date();
        const desde = new Date(agora.getTime() - 30000);
        let where = { updatedAt: { gte: desde } };
        if (user.role !== 'admin') {
          where = { ...where, createdById: user.id };
        }
        const tickets = await prisma.ticket.findMany({
          where,
          take: 5,
          orderBy: { updatedAt: 'desc' },
          select: { id: true, updatedAt: true },
        });
        if (tickets.length) {
          res.write('data: ' + JSON.stringify({ type: 'ticket_update', ticketId: tickets[0].id }) + '\n\n');
        }
      } catch (e) {}
    }, 5000);

    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } catch (e) {
    res.end();
  }
}

/* ---------- Roteador principal (atualizado para incluir stream) ---------- */
module.exports = async function handler(req, res) {
  const url = req.url || '';

  // Detecção de stream SSE
  if (url.includes('/stream') || url.includes('stream')) {
    return handleStream(req, res);
  }

  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const isAdmin = user.role === 'admin';
    const action = one(req.query.action);
    const rawId = one(req.query.id);
    const id = rawId ? parseInt(rawId, 10) : null;

    if (req.method === 'GET') {
      if (id) {
        const found = await loadScoped(user, id);
        if (found.error === 404) return json(res, 404, { error: 'Ticket não encontrado' });
        if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
        await prisma.ticketMessage.updateMany({
          where: { ticketId: id, ...(isAdmin ? { authorType: 'cliente' } : { authorType: { in: ['suporte', 'admin'] } }), read: false },
          data: { read: true },
        });
        const fresh = await prisma.ticket.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
        return json(res, 200, { ticket: toClient(fresh) });
      }
      const where = isAdmin ? {} : { createdById: user.id };
      const tickets = await prisma.ticket.findMany({ where, include: { messages: { orderBy: { createdAt: 'asc' } } }, orderBy: { updatedAt: 'desc' } });
      return json(res, 200, { tickets: tickets.map(toClient) });
    }

    if (req.method === 'POST') {
      if (id && action === 'message') return enviarMensagem(req, res, user, id);
      const body = createSchema.parse(normalizeTicketBody(await readJson(req)));
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
          messages: { create: [{ authorId: user.id, authorType: 'cliente', text, read: true }] },
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      return json(res, 201, { ticket: toClient(ticket) });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Ticket não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      const patchRaw = await readJson(req);
      const body = patchSchema.parse({
        status: patchRaw.status,
        priority: patchRaw.priority !== undefined ? patchRaw.priority : patchRaw.prioridade,
        subject: patchRaw.subject !== undefined ? patchRaw.subject : patchRaw.assunto,
      });
      const data = {};
      if (body.status !== undefined) {
        if (!isAdmin && body.status !== 'aberto') return json(res, 403, { error: 'Acesso negado' });
        data.status = body.status;
      }
      if (body.priority !== undefined) { if (!isAdmin) return json(res, 403, { error: 'Acesso negado' }); data.priority = body.priority; }
      if (body.subject !== undefined) { if (!isAdmin) return json(res, 403, { error: 'Acesso negado' }); data.subject = body.subject; }
      data.updatedAt = new Date();
      const ticket = await prisma.ticket.update({ where: { id }, data, include: { messages: { orderBy: { createdAt: 'asc' } } } });
      return json(res, 200, { ticket: toClient(ticket) });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT']);
  } catch (err) { return handleError(res, err); }
};

module.exports.toClient = toClient;
module.exports.handleStream = handleStream;
