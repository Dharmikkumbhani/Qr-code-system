/**
 * Test Database Connection
 * Run with: node test-db-connection.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set in .env' : 'Not set');
  console.log('');

  try {
    console.log('⏳ Attempting to connect...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');

    // Test query
    console.log('⏳ Testing query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query executed successfully!');
    console.log('Result:', result);
    console.log('');

    // Get database info
    console.log('⏳ Fetching database info...');
    const userCount = await prisma.user.count();
    const restaurantCount = await prisma.restaurant.count();
    const orderCount = await prisma.order.count();
    const customerCount = await prisma.customer.count();

    console.log('✅ Database Statistics:');
    console.log('   - Users:', userCount);
    console.log('   - Restaurants:', restaurantCount);
    console.log('   - Orders:', orderCount);
    console.log('   - Customers:', customerCount);
    console.log('');

    // Check for super admin
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (superAdmin) {
      console.log('✅ Super Admin exists:');
      console.log('   - Name:', superAdmin.name);
      console.log('   - Email:', superAdmin.email);
    } else {
      console.log('⚠️  No Super Admin found!');
      console.log('   Run: node scripts/createSuperAdmin.js');
    }
    console.log('');

    console.log('🎉 All tests passed! Database is working correctly.\n');

  } catch (error) {
    console.error('❌ Database connection failed!\n');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('');

    if (error.code === 'P1001') {
      console.log('💡 Troubleshooting Tips:');
      console.log('   1. Check if database server is running');
      console.log('   2. If using Neon, database might be sleeping');
      console.log('      - Go to https://console.neon.tech');
      console.log('      - Wake up your database');
      console.log('   3. Check your internet connection');
      console.log('   4. Verify DATABASE_URL in .env file');
      console.log('   5. Try using direct connection instead of pooler');
      console.log('');
      console.log('📖 See DATABASE_FIX.md for detailed solutions');
    } else if (error.code === 'P1002') {
      console.log('💡 Database server is unreachable');
      console.log('   - Check if PostgreSQL is running');
      console.log('   - Verify connection string in .env');
    } else if (error.code === 'P1003') {
      console.log('💡 Database does not exist');
      console.log('   - Run: npx prisma db push');
    } else {
      console.log('💡 Unknown error. Check:');
      console.log('   - .env file exists and has DATABASE_URL');
      console.log('   - Database credentials are correct');
      console.log('   - Network/firewall settings');
    }
    console.log('');
  } finally {
    await prisma.$disconnect();
  }
}

// Load environment variables
require('dotenv').config();

// Run test
testConnection();
