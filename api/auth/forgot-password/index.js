const { z } = require('zod');
const { json, handleError, methodNotAllowed } = require('../../../lib/http');
const prisma = require('../../../lib/prisma');
const crypto = require('crypto');

const schema = z.object({ email: z.string().email().max(255) });

// POST /api/auth/forgot-password — solicita link de redefinição
// Nunca revela se o e-mail existe (segurança contra enumeração)
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = schema.parse(await readJson(req));
    const email = String(body.email || '').trim().toLowerCase();

    // Gera token de uso único com validade de 1h
    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Guarda token (produção: tabela dedicada; dev: usamos usuário se existir)
    let user = null;
    try { user = await prisma.user.findUnique({ where: { email } }); } catch (e) {}

    // Em produção, salvaríamos em tabela prospecta_recovery com token/expiresAt/used
    // Aqui apenas preparamos o envio via Gmail (variáveis de ambiente)
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass && user) {
      // TODO: Enviar e-mail via nodemailer/SMTP com o link de reset
      // link: https://app.prospecta.com/recuperar.html?token=<token>
      console.log('[Recuperação] Token para ' + email + ': ' + token + ' (expira em 1h)');
    }

    // Sempre retorna sucesso para não vazar se o e-mail existe
    return json(res, 200, { ok: true, email });
  } catch (err) {
    // Mesmo em erro de validação, não revela info — retorna ok genérico
    return json(res, 200, { ok: true, email: String((req.body && req.body.email) || '') });
  }
};

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); } });
  });
}
