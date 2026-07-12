const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing connection to Neon PostgreSQL...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENT' : 'MISSING');
  
  try {
    // Try to run a simple query
    const roles = await prisma.role.findMany();
    console.log('✅ Connection Successful!');
    console.log(`Roles found in DB: ${roles.length}`);
    roles.forEach(r => console.log(` - ${r.name}`));
  } catch (err) {
    console.error('❌ Connection Failed!');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
