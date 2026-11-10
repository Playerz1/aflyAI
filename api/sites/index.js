const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const { prisma, slugify, scopeWhere, logActivity } = require('../../lib/business');

//   GET    /api/sites          -> lista
//   GET    /api/sites?id=...   -> detalhe
//   POST   /api/sites          -> cria
//   PATCH  /api/sites?id=...   -> atualiza
//   DELETE /api/sites?id=...   -> remove

const SITE_STATUS = ['rascunho', 'publicado', 'arquivado'];
const BASE_DOMAIN = process.env.SITE_BASE_DOMAIN || 'aflyai.vercel.app';

const createSchema = z.object({
  name: z.string().trim().min(2).max(160),
  subdomain: z.string().trim().max(60).nullish(),
  domain: z.string().trim().max(255).nullish(),
  status: z.enum(SITE_STATUS).optional().default('rascunho'),
  plan: z.string().trim().max(40).optional().default('gratis'),
  clientId: z.string().trim().max(40).nullish(),
});

const patchSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  subdomain: z.string().trim().max(60).optional(),
  domain: z.string().trim().max(255).optional(),
  status: z.enum(SITE_STATUS).optional(),
  plan: z.string().trim().max(40).optional(),
  clientId: z.string().trim().max(40).nullish(),
});

function one(v) { return Array.isArray(v) ? v[0] : v; }

function toClient(site) {
  return {
    id: site.id,
    name: site.name,
    domain: site.domain,
    subdomain: site.subdomain,
    status: site.status,
    plan: site.plan,
    createdById: site.createdById,
    clientId: site.clientId || null,
    client: site.client ? { id: site.client.id, name: site.client.name, email: site.client.email } : null,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
    publishedAt: site.publishedAt || null,
  };
}

async function uniqueSubdomain(base) {
  const root = slugify(base) || 'site';
  let candidate = root;
  let i = 1;
  while (await prisma.site.findUnique({ where: { subdomain: candidate } })) {
    i += 1;
    candidate = `${root}-${i}`;
    if (i > 500) throw new Error('Não foi possível gerar um subdomínio único');
  }
  return candidate;
}

async function loadScoped(user, id) {
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) return { error: 404 };
  const mine = site.createdById === user.id || site.clientId === user.id;
  if (user.role !== 'admin' && !mine) return { error: 403 };
  return { site };
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = one(req.query.id);

    if (req.method === 'GET' && !id) {
      const sites = await prisma.site.findMany({
        where: scopeWhere(user, ['createdById', 'clientId']),
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { id: true, name: true, email: true } } },
      });
      return json(res, 200, { sites: sites.map(toClient) });
    }

    if (req.method === 'POST') {
      const body = createSchema.parse(await readJson(req));

      let clientId = null;
      if (body.clientId) {
        const client = await prisma.user.findUnique({ where: { id: body.clientId } });
        if (!client) return json(res, 400, { error: 'Cliente informado não existe' });
        if (user.role !== 'admin' && client.id !== user.id) return json(res, 403, { error: 'Sem permissão para este cliente' });
        clientId = client.id;
      }

      const subdomain = body.subdomain ? slugify(body.subdomain) : await uniqueSubdomain(body.name);
      if (!subdomain) return json(res, 400, { error: 'Subdomínio inválido' });
      const taken = await prisma.site.findUnique({ where: { subdomain } });
      if (taken) return json(res, 409, { error: 'Subdomínio já em uso', field: 'subdomain' });

      const domain = body.domain ? body.domain.toLowerCase() : `${subdomain}.${BASE_DOMAIN}`;
      const publishedAt = body.status === 'publicado' ? new Date() : null;

      const site = await prisma.site.create({
        data: {
          name: body.name,
          domain,
          subdomain,
          status: body.status,
          plan: body.plan || 'gratis',
          createdById: user.id,
          clientId,
          publishedAt,
        },
        include: { client: { select: { id: true, name: true, email: true } } },
      });

      if (site.status === 'publicado') {
        await logActivity({
          type: 'site_published',
          title: 'Site publicado',
          description: `${site.name} · ${site.domain}`,
          userId: user.id,
          siteId: site.id,
        });
      }

      return json(res, 201, { site: toClient(site) });
    }

    if (!id) return json(res, 400, { error: 'ID inválido' });

    const found = await loadScoped(user, id);
    if (found.error === 404) return json(res, 404, { error: 'Site não encontrado' });
    if (found.error === 403) return json(res, 403, { error: 'Sem permissão para este site' });

    if (req.method === 'GET') {
      const site = await prisma.site.findUnique({
        where: { id },
        include: {
          client: { select: { id: true, name: true, email: true } },
          activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      });
      return json(res, 200, {
        site: Object.assign(toClient(site), {
          activities: (site.activities || []).map(a => ({ id: a.id, type: a.type, title: a.title, description: a.description, createdAt: a.createdAt })),
        }),
      });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = patchSchema.parse(await readJson(req));
      const data = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.plan !== undefined) data.plan = body.plan;
      if (body.clientId !== undefined) {
        if (body.clientId) {
          const client = await prisma.user.findUnique({ where: { id: body.clientId } });
          if (!client) return json(res, 400, { error: 'Cliente informado não existe' });
          if (user.role !== 'admin' && client.id !== user.id) return json(res, 403, { error: 'Sem permissão para este cliente' });
          data.clientId = client.id;
        } else {
          data.clientId = null;
        }
      }
      if (body.subdomain !== undefined) {
        const sub = slugify(body.subdomain);
        if (!sub) return json(res, 400, { error: 'Subdomínio inválido' });
        const conflict = await prisma.site.findUnique({ where: { subdomain: sub } });
        if (conflict && conflict.id !== id) return json(res, 409, { error: 'Subdomínio já em uso', field: 'subdomain' });
        data.subdomain = sub;
      }
      if (body.domain !== undefined) {
        const domain = body.domain.toLowerCase();
        const conflict = await prisma.site.findUnique({ where: { domain } });
        if (conflict && conflict.id !== id) return json(res, 409, { error: 'Domínio já em uso', field: 'domain' });
        data.domain = domain;
      }
      if (body.status !== undefined) {
        data.status = body.status;
        if (body.status === 'publicado' && !found.site.publishedAt) data.publishedAt = new Date();
      }

      const site = await prisma.site.update({
        where: { id },
        data,
        include: { client: { select: { id: true, name: true, email: true } } },
      });

      if (body.status === 'publicado' && found.site.status !== 'publicado') {
        await logActivity({
          type: 'site_published',
          title: 'Site publicado',
          description: `${site.name} · ${site.domain}`,
          userId: user.id,
          siteId: site.id,
        });
      }

      return json(res, 200, { site: toClient(site) });
    }

    if (req.method === 'DELETE') {
      await prisma.site.delete({ where: { id } });
      return json(res, 200, { ok: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
  } catch (err) { return handleError(res, err); }
};

module.exports.toClient = toClient;
module.exports.SITE_STATUS = SITE_STATUS;
