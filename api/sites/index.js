const { json, readJson, handleError, methodNotAllowed, z } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const { prisma, dateOrNull, slugify, scopeWhere, logActivity } = require('../../lib/business');

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

module.exports = async function handler(req, res) {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method === 'GET') {
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
      const publishedAt = body.status === 'publicado' ? new Date() : dateOrNull(null);

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

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (err) { return handleError(res, err); }
};

module.exports.toClient = toClient;
module.exports.SITE_STATUS = SITE_STATUS;
