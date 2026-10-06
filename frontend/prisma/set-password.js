// Sets (or resets) a staff user's sign-in password.
// Usage: node prisma/set-password.js <email> <password>
// In the cluster: kubectl -n dev exec deploy/infinitecareers-frontend -- node prisma/set-password.js admin@example.com 'NewPassw0rd'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 8) {
    console.error('Usage: node prisma/set-password.js <email> <password (min 8 chars)>');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL?.startsWith('file:/') ? process.env.DATABASE_URL : 'file:./dev.db';
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const user = await prisma.user.update({
      where: { email: email.trim().toLowerCase() },
      data: { passwordHash: await bcrypt.hash(password, 12) },
      select: { email: true, role: true },
    });
    console.log(`Password set for ${user.email} (${user.role})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err.code === 'P2025' ? 'No staff user with that email' : err);
  process.exit(1);
});
