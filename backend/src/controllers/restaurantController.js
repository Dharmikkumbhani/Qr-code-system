const prisma = require('../config/prisma');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/errors');
const bcrypt = require('bcryptjs');

// GET all restaurants (Super Admin only usually)
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        owner: {
          select: { name: true, email: true }
        },
        _count: {
          select: { tables: true, orders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return sendSuccess(res, 200, 'Restaurants fetched successfully', restaurants);
  } catch (error) {
    next(error);
  }
};

// POST create a new restaurant & assign an owner
exports.createRestaurant = async (req, res, next) => {
  try {
    const { name, slug, phone, address, ownerEmail, ownerName, ownerPassword } = req.body;

    if (!name || !slug || !ownerEmail || !ownerPassword) {
      return next(new AppError('Please provide restaurant name, slug, and owner credentials', 400));
    }

    // Wrap in a transaction: Create/Find Owner -> Create Restaurant
    const result = await prisma.$transaction(async (tx) => {
      // Check if owner email exists
      let owner = await tx.user.findUnique({ where: { email: ownerEmail } });
      
      if (!owner) {
        // Create new owner
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(ownerPassword, salt);
        owner = await tx.user.create({
          data: {
            email: ownerEmail,
            name: ownerName || 'Restaurant Owner',
            passwordHash,
            role: 'OWNER'
          }
        });
      }

      // Check if slug exists
      const existingSlug = await tx.restaurant.findUnique({ where: { slug } });
      if (existingSlug) {
        throw new AppError('Restaurant slug must be unique', 400);
      }

      // Create Restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name,
          slug,
          phone,
          address,
          ownerId: owner.id
        }
      });

      return restaurant;
    });

    return sendSuccess(res, 201, 'Restaurant created successfully', result);
  } catch (error) {
    next(error);
  }
};

// GET tables for a restaurant
exports.getTables = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tables = await prisma.table.findMany({
      where: { restaurantId: id },
      orderBy: { tableNumber: 'asc' }
    });
    return sendSuccess(res, 200, 'Tables fetched successfully', tables);
  } catch (error) {
    next(error);
  }
};

// POST generate tables for a restaurant
exports.generateTables = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { count } = req.body;

    if (!count || count < 1) {
      return next(new AppError('Please provide a valid number of tables to generate', 400));
    }

    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      return next(new AppError('Restaurant not found', 404));
    }

    // Get current highest table number to avoid duplicates if generating more later
    const existingTables = await prisma.table.count({ where: { restaurantId: id } });
    
    const newTables = [];
    for (let i = 1; i <= count; i++) {
      const tableNum = existingTables + i;
      newTables.push({
        restaurantId: id,
        tableNumber: `Table ${tableNum}`,
        qrCodeUrl: `/menu/${restaurant.slug}` // The UUID will be appended on the frontend dynamically
      });
    }

    await prisma.table.createMany({ data: newTables });
    
    // Fetch all tables to return
    const allTables = await prisma.table.findMany({
      where: { restaurantId: id },
      orderBy: { tableNumber: 'asc' }
    });

    return sendSuccess(res, 201, `${count} tables generated successfully`, allTables);
  } catch (error) {
    next(error);
  }
};
