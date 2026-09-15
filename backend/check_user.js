const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const user = await prisma.user.findUnique({ where: { email: '248r1a67a8@gmail.com' } });
  if (!user) {
    console.log("User not found! Creating one...");
    const hashedPassword = await bcrypt.hash('charan123', 10);
    const newUser = await prisma.user.create({
      data: {
        name: "Admin",
        email: "248r1a67a8@gmail.com",
        password: hashedPassword,
        role: "ADMIN"
      }
    });
    console.log("Created admin user:", newUser);
  } else {
    console.log("User exists:", user);
    if (user.role !== 'ADMIN') {
        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
        });
        console.log("Updated role to ADMIN");
    }
    const isValid = await bcrypt.compare('charan123', user.password);
    console.log("Password valid:", isValid);
    if (!isValid) {
      console.log("Password was incorrect. Updating password...");
      const hashedPassword = await bcrypt.hash('charan123', 10);
      await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
      });
      console.log("Password updated.");
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
