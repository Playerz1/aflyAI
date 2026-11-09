const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

function initials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U';
}

async function main() {
  const email = process.env.ADMIN_EMAIL || 'rafael@agenciamendes.com';
  const password = process.env.ADMIN_PASSWORD || 'change-me-on-first-run';
  const name = process.env.ADMIN_NAME || 'Rafael Mendes';

  if (password === 'change-me-on-first-run') {
    console.warn('[seed] ADMIN_PASSWORD está com valor padrão. Defina uma senha forte no .env antes de usar em produção.');
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name, initials: initials(name), passwordHash: hash, role: 'admin', status: 'active', plan: 'Pro', jobTitle: 'Proprietário' },
    create: { name, initials: initials(name), email: email.toLowerCase(), passwordHash: hash, role: 'admin', status: 'active', plan: 'Pro', jobTitle: 'Proprietário' },
  });
  console.log('[seed] admin pronto:', user.email, '(id:', user.id + ')');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
