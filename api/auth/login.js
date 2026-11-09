const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../../lib/prisma');
const { json, readJson, handleError, methodNotAllowed, setCookie, safeUser } = require('../../lib/http');
const { sign, COOKIE, MAX_AGE } = require('../../lib/auth');

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(4).max(200),
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = schema.parse(await readJson(req));
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !user.passwordHash) return json(res, 401, { error: 'Credenciais inválidas' });
    if (user.status === 'blocked') return json(res, 403, { error: 'Usuário bloqueado' });
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return json(res, 401, { error: 'Credenciais inválidas' });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), status: user.status === 'invite' ? 'active' : user.status } });
    const token = sign(user);
    setCookie(res, COOKIE, token, { httpOnly: true, sameSite: 'Lax', maxAge: MAX_AGE, secure: process.env.NODE_ENV === 'production', path: '/' });
    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    return json(res, 200, { user: safeUser(fresh) });
  } catch (err) { return handleError(res, err); }
};
