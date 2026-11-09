const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, safeUser } = require('../../lib/http');
const { requireAdmin } = require('../../lib/auth');

function initials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(6).max(200).optional(),
  plan: z.string().max(40).optional().default('Pro'),
  role: z.enum(['admin', 'member', 'client']).optional().default('member'),
  status: z.enum(['active', 'invite', 'blocked']).optional().default('invite'),
  jobTitle: z.string().max(120).optional().default(''),
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const body = schema.parse(await readJson(req));
    const data = {
      name: body.name.trim(),
      initials: initials(body.name),
      email: body.email.toLowerCase(),
      plan: body.plan,
      role: body.role,
      status: body.status,
      jobTitle: body.jobTitle || '',
    };
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({ data });
    return json(res, 201, { user: safeUser(user) });
  } catch (err) { return handleError(res, err); }
};
