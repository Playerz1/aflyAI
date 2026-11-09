const jwt = require('jsonwebtoken');
const { parseCookies, clearCookie, json } = require('./http');
const prisma = require('./prisma');

const COOKIE = 'prospecta_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'replace-with-a-long-random-secret') {
    throw new Error('JWT_SECRET não configurado');
  }
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    secret,
    { expiresIn: MAX_AGE }
  );
}

function verify(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try { return jwt.verify(token, secret); } catch { return null; }
}

async function getSessionUser(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE];
  if (!token) return null;
  const payload = verify(token);
  if (!payload || !payload.sub) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status === 'blocked') return null;
  return user;
}

async function requireAuth(req, res) {
  const user = await getSessionUser(req);
  if (!user) { json(res, 401, { error: 'Não autenticado' }); return null; }
  return user;
}

async function requireAdmin(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') { json(res, 403, { error: 'Acesso restrito a administradores' }); return null; }
  return user;
}

module.exports = { COOKIE, MAX_AGE, sign, verify, getSessionUser, requireAuth, requireAdmin, clearCookie };
