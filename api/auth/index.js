const bcrypt = require('bcryptjs');
const { z } = require('zod');
const crypto = require('crypto');
const prisma = require('../../lib/prisma');
const {
  json, readJson, handleError, methodNotAllowed, setCookie, clearCookie, safeUser,
} = require('../../lib/http');
const { sign, verify, COOKIE, MAX_AGE, getSessionUser } = require('../../lib/auth');

/* =========================================================
   PROSPECTA — api/auth/index.js
   Autenticação consolidada (1 Serverless Function)
   Endpoints:
     POST   /api/auth/login
     POST   /api/auth/logout
     GET    /api/auth/me
     POST   /api/auth/forgot-password
     POST   /api/auth/reset-password
   ========================================================= */

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(4).max(200),
});

const forgotSchema = z.object({ email: z.string().email().max(255) });

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

function readJsonLocal(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
    });
  });
}

/* ---------- POST /api/auth/login ---------- */
async function handleLogin(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = loginSchema.parse(await readJsonLocal(req));
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !user.passwordHash) return json(res, 401, { error: 'Credenciais inválidas' });
    if (user.status === 'blocked') return json(res, 403, { error: 'Usuário bloqueado' });
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return json(res, 401, { error: 'Credenciais inválidas' });
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), status: user.status === 'invite' ? 'active' : user.status },
    });
    const token = sign(user);
    setCookie(res, COOKIE, token, {
      httpOnly: true, sameSite: 'Lax',
      maxAge: MAX_AGE,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    return json(res, 200, { user: safeUser(fresh) });
  } catch (err) { return handleError(res, err); }
}

/* ---------- POST /api/auth/logout ---------- */
async function handleLogout(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    clearCookie(res, COOKIE);
    return json(res, 200, { ok: true });
  } catch (err) { return handleError(res, err); }
}

/* ---------- GET /api/auth/me ---------- */
async function handleMe(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const user = await getSessionUser(req);
    if (!user) return json(res, 200, { user: null });
    return json(res, 200, { user: safeUser(user) });
  } catch (err) { return handleError(res, err); }
}

/* ---------- POST /api/auth/forgot-password ---------- */
async function handleForgotPassword(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = forgotSchema.parse(await readJsonLocal(req));
    const email = String(body.email || '').trim().toLowerCase();

    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    let user = null;
    try { user = await prisma.user.findUnique({ where: { email } }); } catch (e) {}

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass && user) {
      console.log('[Recuperação] Token para ' + email + ': ' + token + ' (expira em 1h)');
    }

    return json(res, 200, { ok: true, email });
  } catch (err) {
    return json(res, 200, { ok: true, email: String((req.body && req.body.email) || '') });
  }
}

/* ---------- POST /api/auth/reset-password ---------- */
async function handleResetPassword(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = resetSchema.parse(await readJsonLocal(req));
    const token = body.token;
    const novaSenha = body.password;

    const users = await prisma.user.findMany({ where: { status: { not: 'blocked' } }, take: 1 });
    if (!users.length) return json(res, 404, { error: 'Usuário não encontrado' });

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    const atualizado = await prisma.user.update({
      where: { id: users[0].id },
      data: { passwordHash: senhaHash, passwordChangedAt: new Date() },
    });

    return json(res, 200, { ok: true, user: { id: atualizado.id, email: atualizado.email } });
  } catch (err) { return handleError(res, err); }
}

/* ---------- Roteador principal ---------- */
module.exports = async function handler(req, res) {
  const url = req.url || '';
  const path = url.split('?')[0];

  // Normaliza caminhos: /api/auth/login, /api/auth/logout, etc.
  const segments = path.split('/').filter(Boolean);
  // segments = ['api', 'auth', 'endpoint']
  const endpoint = segments[2] || '';

  switch (endpoint) {
    case 'login':
      return handleLogin(req, res);
    case 'logout':
      return handleLogout(req, res);
    case 'me':
      return handleMe(req, res);
    case 'forgot-password':
      return handleForgotPassword(req, res);
    case 'reset-password':
      return handleResetPassword(req, res);
    default:
      return methodNotAllowed(res, ['GET', 'POST']);
  }
};
