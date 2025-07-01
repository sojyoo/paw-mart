const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    const email = 'laurel.j.bscs@gmail.com'; // The email to promote

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('❌ User not found:', email);
      return;
    }

    if (user.role === 'ADMIN') {
      console.log('✅ User is already an admin:', email);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });

    console.log('✅ User promoted to admin:', email);
  } catch (error) {
    console.error('❌ Error updating user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin(); 