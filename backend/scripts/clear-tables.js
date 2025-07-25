// backend/scripts/clear-tables.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando limpeza das tabelas...');

  // Deleta em uma ordem que respeita as dependências
  await prisma.campaign.deleteMany({});
  console.log('Todas as campanhas foram deletadas.');

  await prisma.template.deleteMany({});
  console.log('Todos os templates foram deletados.');

  console.log('Limpeza concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('Ocorreu um erro durante a limpeza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });