const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, safeUser, z } = require('../../lib/http');
const { requireAdmin } = require('../../lib/auth');

function initials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  plan: z.string().max(40).optional().default('Pro'),
  role: z.enum(['admin', 'member', 'client']).optional().default('member'),
  status: z.enum(['active', 'invite', 'blocked']).optional().default('invite'),
  jobTitle: z.string().max(120).optional().default(''),
});

module.exports = async function handler(req, res) {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    if (req.method === 'GET') {
      const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
      return json(res, 200, { users: users.map(safeUser) });
    }
    if (req.method === 'POST') {
      const body = createSchema.parse(await readJson(req));
      const user = await prisma.user.create({
        data: { name: body.name.trim(), initials: initials(body.name), email: body.email.toLowerCase(), plan: body.plan, role: body.role, status: body.status, jobTitle: body.jobTitle || '' }
      });
      return json(res, 201, { user: safeUser(user) });
    }
    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (err) { return handleError(res, err); }
};
