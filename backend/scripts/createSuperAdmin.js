/**
 * Script to create a Super Admin user
 * Run with: node scripts/createSuperAdmin.js
 */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating Super Admin user...\n');

    // Check if super admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@petpooja.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Super Admin already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('\nIf you want to reset the password, delete this user first.');
      return;
    }

    // Hash password
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create super admin
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@petpooja.com',
        passwordHash,
        role: 'SUPER_ADMIN'
      }
    });

    console.log('✅ Super Admin created successfully!\n');
    console.log('📧 Email:', admin.email);
    console.log('🔒 Password:', password);
    console.log('👤 Name:', admin.name);
    console.log('🔑 Role:', admin.role);
    console.log('🆔 ID:', admin.id);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('⚠️  IMPORTANT: Do not share these credentials!\n');

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSuperAdmin();
