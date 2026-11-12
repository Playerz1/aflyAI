const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');

function one(v) { return Array.isArray(v) ? v[0] : v; }

const createSchema = z.object({
  name: z.string().min(2).max(180),
  domain: z.string().min(2).max(200),
  subdomain: z.string().min(2).max(200),
  status: z.enum(['rascunho', 'publicado', 'arquivado']).optional().default('rascunho'),
  plan: z.string().max(40).optional().default('gratis'),
  clientId: z.string().optional(),
});

const patchSchema = z.object({
  name: z.string().min(2).max(180).optional(),
  domain: z.string().min(2).max(200).optional(),
  subdomain: z.string().min(2).max(200).optional(),
  status: z.enum(['rascunho', 'publicado', 'arquivado']).optional(),
  plan: z.string().max(40).optional(),
  clientId: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
});

function toClient(s) {
  return {
    id: s.id,
    name: s.name,
    domain: s.domain,
    subdomain: s.subdomain,
    status: s.status,
    plan: s.plan,
    createdById: s.createdById,
    clientId: s.clientId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    publishedAt: s.publishedAt,
  };
}

async function loadScoped(user, id) {
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) return { error: 404 };
  if (user.role !== 'admin' && site.createdById !== user.id && site.clientId !== user.id) return { error: 403 };
  return { site };
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
        if (found.error === 404) return json(res, 404, { error: 'Site não encontrado' });
        if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });
        return json(res, 200, { site: toClient(found.site) });
      }
      const where = isAdmin ? {} : { OR: [{ createdById: user.id }, { clientId: user.id }] };
      const sites = await prisma.site.findMany({ where, orderBy: { createdAt: 'desc' } });
      return json(res, 200, { sites: sites.map(toClient) });
    }

    if (req.method === 'POST') {
      const body = createSchema.parse(await readJson(req));
      const site = await prisma.site.create({
        data: {
          name: body.name,
          domain: body.domain,
          subdomain: body.subdomain,
          status: body.status,
          plan: body.plan,
          clientId: body.clientId || null,
          createdById: user.id,
        },
      });
      return json(res, 201, { site: toClient(site) });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Site não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      const body = patchSchema.parse(await readJson(req));
      const data = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.domain !== undefined) data.domain = body.domain;
      if (body.subdomain !== undefined) data.subdomain = body.subdomain;
      if (body.status !== undefined) data.status = body.status;
      if (body.plan !== undefined) data.plan = body.plan;
      if (body.clientId !== undefined) data.clientId = body.clientId;
      if (body.publishedAt !== undefined) data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
      data.updatedAt = new Date();

      const site = await prisma.site.update({ where: { id }, data });
      return json(res, 200, { site: toClient(site) });
    }

    if (req.method === 'DELETE') {
      if (!id) return json(res, 400, { error: 'ID inválido' });
      const found = await loadScoped(user, id);
      if (found.error === 404) return json(res, 404, { error: 'Site não encontrado' });
      if (found.error === 403) return json(res, 403, { error: 'Acesso negado' });

      await prisma.site.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};
