const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.userProfile.upsert({
    where: { userId: '694c56c113ac676a0a70378f' },
    update: { isAdmin: true, plan: 'pro' },
    create: {
      userId: '694c56c113ac676a0a70378f',
      isAdmin: true,
      plan: 'pro'
    }
  });
  
  console.log('✅ Admin criado:', result);
}

main()
  .then(() => process.exit())
  .catch(console.error);