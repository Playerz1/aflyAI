const { json, handleError, methodNotAllowed, getSessionUser, requireAdmin } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const prisma = require('../../lib/prisma');

// SSE stream de tickets para atualização em tempo real (sem F5)
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const user = await requireAuth(req, res);
  if (!user) return;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Envia heartbeat inicial
  res.write('data: {"type":"hello"}\n\n');

  let interval;
  try {
    interval = setInterval(async () => {
      try {
        // Verifica se há tickets recentes (últimos 30s)
        const agora = new Date();
        const desde = new Date(agora.getTime() - 30000);
        let where = { updatedAt: { gte: desde } };
        if (user.role !== 'admin') {
          where = { ...where, clienteEmail: user.email };
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
};
