const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./utils/helpers');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'laurel.j.bscs@gmail.com'; // The email to reset
    const newPassword = 'admin123'; // The new password

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('❌ User not found:', email);
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    console.log('✅ Password reset for:', email);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword(); 