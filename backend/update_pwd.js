const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  try {
    const hash = await bcrypt.hash('charan123', 10);
    await prisma.user.update({
      where: { email: '248r1a67a8@gmail.com' },
      data: { password: hash }
    });
    console.log('Password successfully updated!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
