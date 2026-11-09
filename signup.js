const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, safeUser } = require('../../lib/http');
const { setSessionCookie } = require('../../lib/auth');

function initials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(6).max(200),
  plan: z.string().max(40).optional().default('Pro'),
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = schema.parse(await readJson(req));
    const email = body.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return json(res, 409, { error: 'E-mail já cadastrado' });
    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        initials: initials(body.name),
        email,
        plan: body.plan || 'Pro',
        role: 'member',
        status: 'active',
        jobTitle: 'Usuário',
        passwordHash: await bcrypt.hash(body.password, 12),
      },
    });
    setSessionCookie(res, user);
    return json(res, 201, { user: safeUser(user) });
  } catch (err) { return handleError(res, err); }
};
