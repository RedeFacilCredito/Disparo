// backend/prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o script de seed...');

  // --- Criação do Usuário Padrão ---
  const emailAdmin = 'setorsistemas@facilitpromotora.com';
  const senhaPlana = 'Facilit123'; // Defina uma senha forte aqui

  // Criptografa a senha
  const salt = await bcrypt.genSalt(10);
  const senhaCriptografada = await bcrypt.hash(senhaPlana, salt);

  // Usa 'upsert' para criar o usuário se ele não existir, ou atualizá-lo caso exista
  const usuarioAdmin = await prisma.user.upsert({
    where: { email: emailAdmin },
    update: {
      password: senhaCriptografada, // Atualiza a senha se o usuário já existir
    },
    create: {
      email: emailAdmin,
      name: 'Admin Facilit',
      password: senhaCriptografada,
    },
  });

  console.log(`Usuário padrão '${usuarioAdmin.email}' criado/atualizado com sucesso.`);
  console.log('Script de seed concluído.');
}

main()
  .catch((e) => {
    console.error('Ocorreu um erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });