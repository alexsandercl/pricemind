/**
 * 🔧 SCRIPT DE SINCRONIZAÇÃO
 * Execute este script UMA VEZ para criar/atualizar o UserProfile no PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncUserProfile() {
  try {
    const userId = '694d9112102b3a954ae162e0'; // Seu user ID do MongoDB

    // Verificar se já existe
    let profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (profile) {
      // Atualizar
      console.log('📝 Atualizando UserProfile existente...');
      profile = await prisma.userProfile.update({
        where: { userId },
        data: {
          name: 'alexsander',
          plan: 'business', // 🔥 IMPORTANTE
          isAdmin: true,
          role: 'ceo'
        }
      });
      console.log('✅ UserProfile atualizado:', profile);
    } else {
      // Criar
      console.log('🆕 Criando novo UserProfile...');
      profile = await prisma.userProfile.create({
        data: {
          userId,
          name: 'alexsander',
          plan: 'business', // 🔥 IMPORTANTE
          isAdmin: true,
          role: 'ceo',
          onboardingCompleted: true
        }
      });
      console.log('✅ UserProfile criado:', profile);
    }

    console.log('\n🎉 Sincronização completa!');
    console.log('Agora você pode fazer análises com plano Business.');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncUserProfile();