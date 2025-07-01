const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./utils/helpers');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Change this to your actual email address
    const adminEmail = 'laurel.j.bscs@gmail.com'; // REPLACE WITH YOUR EMAIL
    const adminPassword = 'admin123';
    const adminName = 'PawMart Admin';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('✅ Admin already exists:', adminEmail);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(adminPassword);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 User ID:', admin.id);

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 