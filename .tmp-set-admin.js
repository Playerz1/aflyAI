const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
(async () => {
  const prisma = new PrismaClient();
  try {
    const email = 'rhiquelmehenrique2308@gmail.com';
    const password = 'rhiquelme2308';
    const name = 'Rhiquelme Henrique';
    const hash = await bcrypt.hash(password, 12);
    const initials = name.split(/\s+/).map(p=>p[0]||'').join('').slice(0,2).toUpperCase() || 'RH';
    const existing = await prisma.user.findUnique({ where: { email } });
    let user;
    if (existing) {
      user = await prisma.user.update({ where: { email }, data: { name, initials, role: 'admin', status: 'active', passwordHash: hash } });
    } else {
      user = await prisma.user.create({ data: { email, name, initials, role: 'admin', status: 'active', plan: 'Pro', jobTitle: 'Administrador', passwordHash: hash } });
    }
    console.log(JSON.stringify({ ok:true, id:user.id, email:user.email, role:user.role, status:user.status }));
  } catch (e) { console.error('ERR', e.message); process.exit(1); }
  finally { await prisma.$disconnect(); }
})();
