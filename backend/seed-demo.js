require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Demo Restaurant...');

  // 1. Create Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      name: 'Demo Owner',
      email: 'owner@demo.com',
      passwordHash: 'dummy',
      role: 'OWNER',
    },
  });

  // 2. Create Restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'demo-resto' },
    update: {},
    create: {
      name: 'Demo Restaurant',
      slug: 'demo-resto',
      phone: '9876543210',
      address: '123 Demo St.',
      ownerId: owner.id,
      subscriptionStatus: 'ACTIVE',
    },
  });

  // 3. Create Table
  const table = await prisma.table.create({
    data: {
      restaurantId: restaurant.id,
      tableNumber: 'Table 1',
      qrCodeUrl: `/menu/demo-resto`,
    },
  });

  // 4. Create Category
  const category = await prisma.category.create({
    data: {
      name: 'Starters',
      restaurantId: restaurant.id,
      sortOrder: 1,
    },
  });

  // 5. Create Menu Items
  await prisma.menuItem.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: 'Paneer Tikka',
        description: 'Delicious grilled paneer.',
        price: 250.0,
        isVeg: true,
        isAvailable: true,
      },
      {
        restaurantId: restaurant.id,
        categoryId: category.id,
        name: 'Chicken Wings',
        description: 'Spicy chicken wings.',
        price: 350.0,
        isVeg: false,
        isAvailable: true,
      },
    ],
  });

  console.log('Demo Restaurant created! Slug: demo-resto, Table ID:', table.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
