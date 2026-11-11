const { json, readJson, handleError, methodNotAllowed } = require('../../lib/http');
const { requireAuth } = require('../../lib/auth');
const prisma = require('../../lib/prisma');
const { z } = require('zod');

const createSchema = z.object({
  type: z.enum(['site', 'app']).optional().default('site'),
  niche: z.string().min(1).max(80),
  state: z.string().max(80).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  prompt: z.string().min(1),
});

// GET /api/projects — lista projetos do usuário logado
// POST /api/projects — cria um novo projeto
module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const projects = await prisma.project.findMany({
        where: { createdById: user.id },
        orderBy: { createdAt: 'desc' },
        include: { establishments: true, negotiations: true },
      });
      return json(res, 200, { projects });
    } catch (err) { return handleError(res, err); }
  }

  if (req.method === 'POST') {
    try {
      const user = await requireAuth(req, res);
      if (!user) return;
      const body = createSchema.parse(await readJson(req));
      const project = await prisma.project.create({
        data: {
          type: body.type,
          niche: body.niche,
          state: body.state,
          city: body.city,
          prompt: body.prompt,
          createdById: user.id,
        },
      });
      return json(res, 201, { project });
    } catch (err) { return handleError(res, err); }
  }

  return methodNotAllowed(res, ['GET', 'POST']);
};
