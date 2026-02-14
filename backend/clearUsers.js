const mongoose = require('mongoose');
require('dotenv').config();

async function clearUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    const result = await mongoose.connection.db.collection('users').deleteMany({});
    console.log(`🗑️ ${result.deletedCount} usuários deletados`);

    await mongoose.disconnect();
    console.log('✅ Desconectado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

clearUsers();