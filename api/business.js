const prisma = require('../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, z } = require('../lib/http');
const { requireAuth } = require('../lib/auth');

function one(v) { return Array.isArray(v) ? v[0] : v; }

/* ---------- Helpers de escopo por recurso ---------- */

const RESOURCES = {
  leads: {
    model: 'lead',
    createFields: ['name','email','phone','company','status','source','value','note','lastContact'],
    patchFields: ['name','email','phone','company','status','source','value','note','lastContact'],
    statuses: ['novo','contato','qualificado','proposta','fechado','perdido'],
    userField: 'createdById',
  },
  contracts: {
    model: 'contract',
    createFields: ['clientName','clientEmail','service','value','status','signedAt','expiresAt','leadId'],
    patchFields: ['clientName','clientEmail','service','value','status','signedAt','expiresAt','leadId'],
    statuses: ['rascunho','ativo','vencido','cancelado'],
    userField: 'createdById',
    include: { lead: { select: { id:true, name:true } } },
  },
  payments: {
    model: 'payment',
    createFields: ['contractId','value','status','dueDate','paidAt','method','note'],
    patchFields: ['value','status','dueDate','paidAt','method','note'],
    statuses: ['pendente','pago','atrasado','estornado'],
    userField: null, // acesso via contract.createdById
    include: { contract: { select: { id:true, clientName:true, status:true, createdById:true } } },
  },
  sites: {
    model: 'site',
    createFields: ['name','domain','subdomain','status','plan','clientId'],
    patchFields: ['name','domain','subdomain','status','plan','clientId','publishedAt'],
    statuses: ['rascunho','publicado','arquivado'],
    userField: 'createdById',
  },
  activities: {
    model: 'activity',
    createFields: ['type','title','description','userId','leadId','contractId','siteId'],
    patchFields: ['type','title','description','userId','leadId','contractId','siteId'],
    statuses: null,
    userField: 'userId',
    include: {
      lead: { select: { id:true, name:true } },
      contract: { select: { id:true, clientName:true } },
      site: { select: { id:true, name:true } },
    },
  },
};

function toClient(r, data) {
  const out = {};
  for (const k of Object.keys(data)) {
    if (k === 'id' || k.endsWith('Id') || k.endsWith('At') || k === 'value') {
      out[k] = k === 'value' ? Number(data[k] || 0) : data[k];
    } else {
      out[k] = data[k];
    }
  }
  return out;
}

async function loadScoped(prisma, user, resource, id) {
  const def = RESOURCES[resource];
  if (!def) return { error: 400 };

  const include = def.include || {};
  const record = await prisma[def.model].findUnique({ where: { id }, include });
  if (!record) return { error: 404 };

  const isAdmin = user.role === 'admin';
  const userField = def.userField;
  let ownerId = record[userField];

  // Pagamentos: verificar via contract.createdById
  if (def.model === 'payment' && record.contract) {
    ownerId = record.contract.createdById;
  }

  if (!isAdmin && ownerId !== user.id) return { error: 403 };
  return { record };
}

function buildWhere(resource, user, isAdmin) {
  const def = RESOURCES[resource];
  if (isAdmin) return {};

  if (def.model === 'payment') {
    return { contract: { createdById: user.id } };
  }
  return { [def.userField]: user.id };
}

/* ---------- Handler principal ---------- */

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const isAdmin = user.role === 'admin';

    const url = req.url || '';
    const pathname = url.split('?')[0];
    const match = pathname.match(/\/api\/business(?:\/([^\/]+))?(?:\/(.+))?/);
    const resource = match && match[1] ? match[1] : one(req.query.resource);
    const id = match && match[2] ? match[2] : (one(req.query.id) || null);

    const def = RESOURCES[resource];
    if (!def) {
      return json(res, 400, { error: 'Recurso inválido. Use: leads, contracts, payments, sites, activities' });
    }

    /* ---------- GET ---------- */
    if (req.method === 'GET') {
      if (id) {
        const found = await loadScoped(prisma, user, resource, id);
        if (found.error === 404) return json(res, 404, { error: `${resource} não encontrado` });
        if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
        return json(res, 200, { [resource.slice(0, -1)]: toClient(resource, found.record) });
      }
      const where = buildWhere(resource, user, isAdmin);
      const records = await prisma[def.model].findMany({
        where,
        include: def.include || undefined,
        orderBy: { createdAt: 'desc' },
      });
      const key = resource.slice(0, -1);
      return json(res, 200, { [key + 's']: records.map(r => toClient(resource, r)) });
    }

    /* ---------- POST ---------- */
    if (req.method === 'POST') {
      const body = await readJson(req);

      // Validações básicas por recurso
      if (resource === 'leads') {
        const s = z.object({
          name: z.string().min(2).max(180),
          email: z.string().email(),
          phone: z.string().max(40).optional(),
          company: z.string().max(180).optional(),
          status: z.enum(def.statuses).optional().default('novo'),
          source: z.string().max(120).optional(),
          value: z.number().optional().default(0),
          note: z.string().max(4000).optional().default(''),
          lastContact: z.string().datetime().optional(),
        }).parse(body);
        const record = await prisma[def.model].create({
          data: {
            name: s.name, email: s.email, phone: s.phone || null, company: s.company || null,
            status: s.status, source: s.source || null, value: s.value, note: s.note || null,
            lastContact: s.lastContact ? new Date(s.lastContact) : null,
            createdById: user.id,
          },
        });
        return json(res, 201, { lead: toClient(resource, record) });
      }

      if (resource === 'contracts') {
        const s = z.object({
          clientName: z.string().min(2).max(180),
          clientEmail: z.string().email(),
          service: z.string().min(2).max(180),
          value: z.number().optional().default(0),
          status: z.enum(def.statuses).optional().default('rascunho'),
          signedAt: z.string().datetime().optional(),
          expiresAt: z.string().datetime().optional(),
          leadId: z.string().optional(),
        }).parse(body);
        const record = await prisma[def.model].create({
          data: {
            clientName: s.clientName, clientEmail: s.clientEmail, service: s.service,
            value: s.value, status: s.status,
            signedAt: s.signedAt ? new Date(s.signedAt) : null,
            expiresAt: s.expiresAt ? new Date(s.expiresAt) : null,
            leadId: s.leadId || null,
            createdById: user.id,
          },
          include: def.include,
        });
        return json(res, 201, { contract: toClient(resource, record) });
      }

      if (resource === 'payments') {
        const s = z.object({
          contractId: z.string(),
          value: z.number().optional().default(0),
          status: z.enum(def.statuses).optional().default('pendente'),
          dueDate: z.string().datetime().optional(),
          paidAt: z.string().datetime().optional(),
          method: z.string().max(40).optional(),
          note: z.string().max(4000).optional().default(''),
        }).parse(body);
        const contract = await prisma.contract.findUnique({ where: { id: s.contractId } });
        if (!contract) return json(res, 404, { error: 'Contrato não encontrado' });
        if (!isAdmin && contract.createdById !== user.id) return json(res, 403, { error: 'Acesso negado' });
        const record = await prisma[def.model].create({
          data: {
            contractId: s.contractId, value: s.value, status: s.status,
            dueDate: s.dueDate ? new Date(s.dueDate) : null,
            paidAt: s.paidAt ? new Date(s.paidAt) : null,
            method: s.method || null, note: s.note || null,
          },
          include: def.include,
        });
        return json(res, 201, { payment: toClient(resource, record) });
      }

      if (resource === 'sites') {
        const s = z.object({
          name: z.string().min(2).max(180),
          domain: z.string().min(2).max(200),
          subdomain: z.string().min(2).max(200),
          status: z.enum(def.statuses).optional().default('rascunho'),
          plan: z.string().max(40).optional().default('gratis'),
          clientId: z.string().optional(),
        }).parse(body);
        const record = await prisma[def.model].create({
          data: {
            name: s.name, domain: s.domain, subdomain: s.subdomain, status: s.status,
            plan: s.plan, clientId: s.clientId || null, createdById: user.id,
          },
        });
        return json(res, 201, { site: toClient(resource, record) });
      }

      if (resource === 'activities') {
        const s = z.object({
          type: z.enum([
            'lead_created','lead_contacted','lead_qualified','contract_created','contract_signed',
            'payment_received','payment_overdue','site_published','user_created','user_blocked',
            'ticket_created','ticket_resolved',
          ]),
          title: z.string().min(2).max(180),
          description: z.string().max(4000).optional(),
          userId: z.string().optional(),
          leadId: z.string().optional(),
          contractId: z.string().optional(),
          siteId: z.string().optional(),
        }).parse(body);
        const record = await prisma[def.model].create({
          data: {
            type: s.type, title: s.title, description: s.description || null,
            userId: s.userId || user.id, leadId: s.leadId || null,
            contractId: s.contractId || null, siteId: s.siteId || null,
          },
          include: def.include,
        });
        return json(res, 201, { activity: toClient(resource, record) });
      }
    }

    /* ---------- PATCH / PUT ---------- */
    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(prisma, user, resource, id);
      if (found.error === 404) return json(res, 404, { error: `${resource} não encontrado` });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      const body = await readJson(req);
      const data = {};
      const patchFields = def.patchFields;

      for (const f of patchFields) {
        if (body[f] !== undefined) {
          if (f.endsWith('At') && body[f]) data[f] = new Date(body[f]);
          else data[f] = body[f];
        }
      }
      data.updatedAt = new Date();

      const record = await prisma[def.model].update({ where: { id }, data, include: def.include || undefined });
      return json(res, 200, { [resource.slice(0, -1)]: toClient(resource, record) });
    }

    /* ---------- DELETE ---------- */
    if (req.method === 'DELETE') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(prisma, user, resource, id);
      if (found.error === 404) return json(res, 404, { error: `${resource} não encontrado` });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      await prisma[def.model].delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};
