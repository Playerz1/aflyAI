/* Helpers compartilhados pelas APIs de negócio (leads, contratos, pagamentos, sites, atividades) */
const prisma = require('./prisma');

// Campos monetários são Decimal no Prisma -> serializamos como número para o frontend
function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : null;
}

function money(value) {
  const n = toNumber(value);
  return n === null ? 0 : Math.round(n * 100) / 100;
}

// Datas em ISO (ou vazio) — aceita string vazia/null como "sem data"
function dateOrNull(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function initials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

function scopeWhere(user, ownFields) {
  // admin vê tudo; demais usuários vêem apenas os próprios registros
  if (user.role === 'admin') return {};
  const fields = ownFields && ownFields.length ? ownFields : ['createdById'];
  return { OR: fields.map(f => ({ [f]: user.id })) };
}

async function logActivity(data) {
  try {
    await prisma.activity.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description || null,
        userId: data.userId || null,
        leadId: data.leadId || null,
        contractId: data.contractId || null,
        siteId: data.siteId || null,
      },
    });
  } catch (err) {
    // registro de atividade nunca deve derrubar a operação principal
    console.warn('[activity]', err.message);
  }
}

function getParamId(req) {
  const id = req.query && req.query.id;
  if (Array.isArray(id)) return id[0];
  return typeof id === 'string' && id ? id : null;
}

module.exports = { prisma, toNumber, money, dateOrNull, slugify, initials, scopeWhere, logActivity, getParamId };
