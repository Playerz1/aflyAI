const { json, readJson, handleError, methodNotAllowed } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const prisma = require('../../lib/prisma');
const { z } = require('zod');

const createSchema = z.object({
  name: z.string().min(1).max(120),
  niche: z.string().min(1).max(80),
  city: z.string().min(1).max(80),
  state: z.string().max(80).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  website: z.string().max(200).optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  projectId: z.string().optional().nullable(),
});

// GET /api/establishments — lista estabelecimentos do usuário logado
// POST /api/establishments — cria um novo estabelecimento
module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const establishments = await prisma.establishment.findMany({
        where: { createdById: user.id },
        orderBy: { createdAt: 'desc' },
        include: { negotiations: true, project: true },
      });
      return json(res, 200, { establishments });
    } catch (err) { return handleError(res, err); }
  }

  if (req.method === 'POST') {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const body = createSchema.parse(await readJson(req));
      const establishment = await prisma.establishment.create({
        data: {
          name: body.name,
          niche: body.niche,
          city: body.city,
          state: body.state,
          phone: body.phone,
          whatsapp: body.whatsapp,
          website: body.website,
          rating: body.rating,
          address: body.address,
          projectId: body.projectId,
          createdById: user.id,
        },
      });
      return json(res, 201, { establishment });
    } catch (err) { return handleError(res, err); }
  }

  return methodNotAllowed(res, ['GET', 'POST']);
};
