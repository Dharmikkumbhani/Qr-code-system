const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Super Admin...');
  
  const passwordHash = await bcrypt.hash('admin', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin',
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Seed completed successfully!', adminUser);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
