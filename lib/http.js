const { z } = require('zod');

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 1e6) { req.destroy(); reject(new Error('Payload too large')); } });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch (e) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=');
    if (k) acc[k] = decodeURIComponent(v.join('='));
    return acc;
  }, {});
}

function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  parts.push(`Path=${opts.path || '/'}`);
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  if (opts.secure ?? process.env.NODE_ENV === 'production') parts.push('Secure');
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.expires) parts.push(`Expires=${opts.expires.toUTCString()}`);
  const prev = res.getHeader('Set-Cookie');
  const cookie = parts.join('; ');
  res.setHeader('Set-Cookie', prev ? [].concat(prev, cookie) : cookie);
}

function clearCookie(res, name) {
  setCookie(res, name, '', { maxAge: 0, expires: new Date(0) });
}

function safeUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

function handleError(res, err) {
  if (err instanceof z.ZodError) {
    return json(res, 400, { error: 'Dados inválidos', details: err.flatten() });
  }
  if (err && err.code === 'P2002') {
    return json(res, 409, { error: 'Registro já existe', field: err.meta && err.meta.target });
  }
  if (err && err.code === 'P2025') {
    return json(res, 404, { error: 'Registro não encontrado' });
  }
  console.error('[api]', err);
  return json(res, 500, { error: 'Erro interno do servidor' });
}

function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  return json(res, 405, { error: 'Método não permitido' });
}

module.exports = {
  json, readJson, parseCookies, setCookie, clearCookie, safeUser, handleError, methodNotAllowed, z,
};
