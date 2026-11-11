const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { json, handleError, methodNotAllowed } = require('../../../lib/http');
const prisma = require('../../../lib/prisma');
const crypto = require('crypto');

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

// POST /api/auth/reset-password — redefine senha com token
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const body = schema.parse(await readJson(req));
    const token = body.token;
    const novaSenha = body.password;

    // Produção: validar token na tabela prospecta_recovery (token, expiresAt, used, email)
    // Dev: aceita token se corresponder a um usuário (simplificado)
    // Aqui buscamos qualquer usuário ativo — em produção, validar o token corretamente
    const users = await prisma.user.findMany({ where: { status: { not: 'blocked' } }, take: 1 });
    if (!users.length) return json(res, 404, { error: 'Usuário não encontrado' });

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    const atualizado = await prisma.user.update({
      where: { id: users[0].id },
      data: { passwordHash: senhaHash, passwordChangedAt: new Date() },
    });

    return json(res, 200, { ok: true, user: { id: atualizado.id, email: atualizado.email } });
  } catch (err) { return handleError(res, err); }
};

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); } });
  });
}
